import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ task, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayKey();
      loadRazorpayScript();
    }
  }, [isOpen]);

  const loadRazorpayKey = async () => {
    try {
      const response = await api.get('/api/payments/key');
      setRazorpayKey(response.data.key_id);
    } catch (error) {
      console.error('Error loading Razorpay key:', error);
      setError('Failed to initialize payment');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!task) return;

    setLoading(true);
    setError(null);

    try {
      const orderResponse = await api.post('/api/payments/create-order', {
        task_id: task.id,
        amount: task.price,
        currency: task.currency || 'INR'
      });

      const { order_id, amount, currency } = orderResponse.data;

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: 'TalentConnect',
        description: task.title,
        order_id: order_id,
        handler: async function (response) {
          setProcessingPayment(true);
          try {
            await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            setProcessingPayment(false);
            onSuccess && onSuccess();
            onClose();
          } catch (error) {
            setProcessingPayment(false);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem('user') || '{}').full_name || '',
          email: JSON.parse(localStorage.getItem('user') || '{}').email || ''
        },
        theme: {
          color: '#22d3ee'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.detail || 'Failed to create payment order');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tc-modal-backdrop flex items-center justify-center p-4" data-testid="payment-modal" onClick={onClose}>
      <div
        className="bento rounded-[28px] max-w-md w-full overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero header */}
        <div className="relative bg-ink-950 text-white p-6 overflow-hidden">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(500px 300px at 0% 0%, rgba(34,211,238,.32), transparent 60%), radial-gradient(400px 250px at 100% 100%, rgba(255,106,91,.25), transparent 60%)',
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center backdrop-blur">
                <CreditCard className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <span className="chip chip-cyan mb-1">secure</span>
                <h3 className="font-display text-2xl leading-none">Payment</h3>
                <p className="text-xs text-ink-300 mt-1">via Razorpay escrow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition"
              disabled={loading || processingPayment}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Task Details */}
          <div className="glass rounded-2xl p-4">
            <h4 className="font-semibold text-ink-950 dark:text-white mb-3">{task?.title}</h4>
            <div className="flex items-end justify-between">
              <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Amount</span>
              <span className="font-display text-4xl leading-none">
                ₹{task?.price?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
            <Lock className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink-950 dark:text-white">Secure escrow payment</p>
              <p className="text-xs text-ink-500 dark:text-ink-300 mt-1">
                Funds are held safely and only released when you approve the submitted work.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-coral-500/10 border border-coral-500/30">
              <AlertCircle className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-coral-600 dark:text-coral-300">{error}</p>
            </div>
          )}

          {/* Processing Message */}
          {processingPayment && (
            <div className="flex items-center gap-3 p-4 rounded-2xl glass">
              <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
              <p className="text-sm text-ink-700 dark:text-ink-200">Verifying payment…</p>
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={loading || processingPayment || !razorpayKey}
            className="w-full btn btn-coral py-3 disabled:opacity-50"
            data-testid="pay-now-btn"
          >
            {loading || processingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay ₹{task?.price?.toFixed(2)}
              </>
            )}
          </button>

          <p className="text-xs text-center text-ink-500 dark:text-ink-300">
            By proceeding, you agree to our terms & conditions
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
