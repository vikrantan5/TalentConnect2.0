from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import PaymentCreate, PaymentResponse, PaymentVerifyRequest
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.payment_service import payment_service
from app.config import settings
from typing import List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/key")
async def get_razorpay_key(current_user_id: str = Depends(get_current_user)):
    """Return Razorpay publishable key for checkout."""
    return {"key_id": settings.RAZORPAY_KEY_ID}


@router.get("/task/{task_id}/status")
async def get_task_payment_status(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Get latest payment status for a specific task."""
    try:
        db = get_db()
        task_result = db.table('tasks').select('id, creator_id, acceptor_id').eq('id', task_id).limit(1).execute()
        if not task_result.data:
            raise HTTPException(status_code=404, detail="Task not found")

        task = task_result.data[0]
        if current_user_id not in [task.get('creator_id'), task.get('acceptor_id')]:
            raise HTTPException(status_code=403, detail="Not authorized")

        payment_result = db.table('payments').select('*').eq('task_id', task_id).order('created_at', desc=True).limit(1).execute()
        return {
            "has_payment": bool(payment_result.data),
            "payment": payment_result.data[0] if payment_result.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-order", response_model=dict)
async def create_payment_order(payment_data: PaymentCreate, current_user_id: str = Depends(get_current_user)):
    """Create a Razorpay order for task payment (creation or completion)"""
    try:
        db = get_db()
        
        # Verify task exists
        task_result = db.table('tasks').select('*').eq('id', str(payment_data.task_id)).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Two scenarios:
        # 1. Task creator paying upfront (task status = pending_payment)
        # 2. Task creator paying for accepted task (task has acceptor)
        
        is_creation_payment = task['status'] == 'pending_payment'
        
        if is_creation_payment:
            # Verify user is the creator
            if task['creator_id'] != current_user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only task creator can pay for task creation"
                )
        else:
            # Verify user is the creator
            if task['creator_id'] != current_user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only task creator can create payment"
                )

            if not task.get('acceptor_id'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Task must be accepted before creating payment"
                )
        
        # Create Razorpay order
        order = payment_service.create_order(
            amount=payment_data.amount,
            currency=payment_data.currency
        )
        
        # Create payment record
        # Get payee from either acceptor_id or assigned_user_id
        payee_id = task.get('acceptor_id') or task.get('assigned_user_id')
        
        new_payment = {
            'task_id': str(payment_data.task_id),
            'payer_id': current_user_id,
            'payee_id': payee_id,  # Will be None for creation payment
            'amount': payment_data.amount,
            'currency': payment_data.currency,
            'razorpay_order_id': order['id'],
            'status': 'pending',
            'is_escrowed': True,
            'payment_type': 'task_creation' if is_creation_payment else 'task_completion'
        }
        payment_result = db.table('payments').insert(new_payment).execute()
        
        return {
            "order_id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "payment_id": payment_result.data[0]['id'] if payment_result.data else None,
            "payment_type": 'task_creation' if is_creation_payment else 'task_completion'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.post("/verify")
async def verify_payment(payload: PaymentVerifyRequest, current_user_id: str = Depends(get_current_user)):

    """Verify Razorpay payment and handle task creation payments with escrow"""
    try:
        db = get_db()
        
        # Verify payment signature
        is_valid = payment_service.verify_payment(
            payload.razorpay_order_id,
            payload.razorpay_payment_id,
            payload.razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
              # Update payment record
        payment_update = {
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature,
            'status': 'completed',
            'escrow_status': None,  # NULL = ESCROWED (held in escrow, not released/refunded)
            'payment_mode': 'TEST',
            'escrowed_at': utc_now_iso()
        }
        
        result = db.table('payments').update(payment_update).eq('razorpay_order_id', payload.razorpay_order_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Payment record not found")
        
        payment = result.data[0]
        
        logger.info(f"[ESCROW] Payment {payment['id']} successfully held in escrow for task {payment.get('task_id')}, amount: ₹{payment['amount']}")
        
        # If this is a task creation payment, make the task visible
        if payment.get('payment_type') == 'task_creation':
            task_id = payment.get('task_id')
            if task_id:
                db.table('tasks').update({
                    'status': 'open',
                    'is_visible': True,
                    'payment_status': 'paid'
                }).eq('id', task_id).execute()
                
                # Notify task creator
                db.table('notifications').insert({
                    'user_id': current_user_id,
                    'title': '✅ Task Payment Successful',
                    'message': f'Your task payment (₹{payment["amount"]}) has been held in escrow. Your task is now visible to all users.',
                    'notification_type': 'payment_success',
                    'reference_id': task_id,
                    'reference_type': 'task'
                }).execute()
                
                logger.info(f"[TEST MODE] Task {task_id} is now visible after payment verification. Payment held in escrow.")
        
        return {
            "message": "Payment verified and held in escrow successfully",
            "status": "completed",
            "escrow_status": "ESCROWED",  # Frontend-friendly status
            "payment_mode": "TEST",
            "payment_type": payment.get('payment_type')
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.post("/release/{payment_id}")
async def release_payment(payment_id: str, current_user_id: str = Depends(get_current_user)):
    """Release escrowed payment to payee (Admin or Task Owner can release)"""
    try:
        db = get_db()
        
        # Get payment
        payment_result = db.table('payments').select('*').eq('id', payment_id).execute()
        
        if not payment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        payment = payment_result.data[0]
        
        # Check if payment is escrowed (is_escrowed=True and escrow_status is NULL)
        if not payment['is_escrowed']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment is not escrowed"
            )
        
        if payment['escrow_status'] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment already processed with status: {payment['escrow_status']}"
            )
        
        # Update payment - change escrow_status from NULL to 'RELEASED'
        db.table('payments').update({
            'status': 'released',
            'escrow_status': 'RELEASED',  # NULL → RELEASED
            'released_at': utc_now_iso()
        }).eq('id', payment_id).execute()
        
        logger.info(f"[ESCROW] Payment {payment_id} released from escrow to payee {payment.get('payee_id')}")
        
        # Create notification for payee
        if payment['payee_id']:
            notification = {
                'user_id': payment['payee_id'],
                'title': '✅ Payment Released',
                'message': f'Payment of ₹{payment["amount"]} has been released to you',
                'notification_type': 'payment',
                'reference_id': payment_id,
                'reference_type': 'payment'
            }
            db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Payment released successfully",
            "payment_id": payment_id,
            "escrow_status": "RELEASED"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error releasing payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-payments", response_model=List[PaymentResponse])
async def get_my_payments(current_user_id: str = Depends(get_current_user)):
    """Get all payments for current user (as payer or payee)"""
    try:
        db = get_db()
        
        # Get payments where user is payer or payee
        payer_payments = db.table('payments').select('*').eq('payer_id', current_user_id).execute()
        payee_payments = db.table('payments').select('*').eq('payee_id', current_user_id).execute()
        
        all_payments = (payer_payments.data or []) + (payee_payments.data or [])
        
        return all_payments
    
    except Exception as e:
        logger.error(f"Error fetching payments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    


@router.post("/refund/{payment_id}")
async def refund_payment(payment_id: str, reason: str, current_user_id: str = Depends(get_current_user)):
    """Refund escrowed payment to task owner (Admin action after rejection)"""
    try:
        db = get_db()
        
        # Get payment
        payment_result = db.table('payments').select('*').eq('id', payment_id).execute()
        
        if not payment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        payment = payment_result.data[0]
        
        # Check if payment is escrowed (is_escrowed=True and escrow_status is NULL)
        if not payment['is_escrowed']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment is not escrowed"
            )
        
        if payment['escrow_status'] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment already processed with status: {payment['escrow_status']}"
            )
        
        # Update payment - change escrow_status from NULL to 'REFUNDED'
        db.table('payments').update({
            'status': 'refunded',
            'escrow_status': 'REFUNDED',  # NULL → REFUNDED
            'refunded_at': utc_now_iso(),
            'refund_reason': reason
        }).eq('id', payment_id).execute()
        
        logger.info(f"[ESCROW] Payment {payment_id} refunded from escrow to payer {payment.get('payer_id')}, reason: {reason}")
        
        # Create notification for payer (task owner)
        if payment['payer_id']:
            notification = {
                'user_id': payment['payer_id'],
                'title': '💰 Payment Refunded',
                'message': f'Payment of ₹{payment["amount"]} has been refunded. Reason: {reason}',
                'notification_type': 'payment',
                'reference_id': payment_id,
                'reference_type': 'payment'
            }
            db.table('notifications').insert(notification).execute()
        
        return {
            "message": "Payment refunded successfully",
            "payment_id": payment_id,
            "escrow_status": "REFUNDED",
            "refund_reason": reason
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refunding payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )