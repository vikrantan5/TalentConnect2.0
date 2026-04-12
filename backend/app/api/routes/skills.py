from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from app.models.schemas import SkillCreate, SkillResponse
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.resume_parser import resume_parser
from app.services.skill_suggestion_service import skill_suggestion_service
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skills", tags=["Skills"])

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_skill(skill_data: SkillCreate, current_user_id: str = Depends(get_current_user)):
    """Add a new skill to user profile"""
    try:
        db = get_db()
        
        # Check if skill already exists for user
        existing_skill = db.table('user_skills').select('id').eq('user_id', current_user_id).eq('skill_name', skill_data.skill_name).eq('skill_type', skill_data.skill_type).execute()
        
        if existing_skill.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have this skill added"
            )
        
        # Create new skill
        new_skill = {
            'user_id': current_user_id,
            'skill_name': skill_data.skill_name,
            'skill_type': skill_data.skill_type,
            'skill_level': skill_data.skill_level,
            'description': skill_data.description if hasattr(skill_data, 'description') else None,
            'years_experience': skill_data.years_experience if hasattr(skill_data, 'years_experience') else None,
            'hourly_rate': skill_data.hourly_rate if hasattr(skill_data, 'hourly_rate') else None,
            'is_verified': False
        }
        
        result = db.table('user_skills').insert(new_skill).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add skill"
            )
        
        return {
            "message": "Skill added successfully",
            "skill": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-skills", response_model=List[SkillResponse])
async def get_my_skills(current_user_id: str = Depends(get_current_user)):
    """Get all skills for current user"""
    try:
        db = get_db()
        
        result = db.table('user_skills').select('*').eq('user_id', current_user_id).execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    auto_add: bool = True,
    current_user_id: str = Depends(get_current_user)
):
    """
    Upload resume (PDF or DOCX) and extract skills automatically
    
    Args:
        file: Resume file (PDF or DOCX)
        auto_add: If True, automatically add extracted skills to user profile
        current_user_id: Current authenticated user
    """
    try:
        # Validate file type
        allowed_extensions = ['pdf', 'docx', 'doc']
        file_extension = file.filename.split('.')[-1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Parse resume and extract skills
        parse_result = resume_parser.parse_resume(file_content, file.filename)
        
        if not parse_result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse resume: {parse_result.get('error', 'Unknown error')}"
            )
        
        # Auto-add skills if requested
        added_skills = []
        skipped_skills = []
        
        if auto_add and parse_result['skills']:
            db = get_db()
            
            # Get existing skills for user
            existing_skills_result = db.table('user_skills').select('skill_name').eq('user_id', current_user_id).execute()
            existing_skill_names = {skill['skill_name'].lower() for skill in existing_skills_result.data} if existing_skills_result.data else set()
            
            # Add new skills
            for skill_name in parse_result['skills']:
                if skill_name.lower() not in existing_skill_names:
                    try:
                        new_skill = {
                            'user_id': current_user_id,
                            'skill_name': skill_name,
                            'skill_type': 'offered',  # Default to offered
                            'skill_level': 'intermediate',  # Default level
                            'is_verified': False
                        }
                        
                        result = db.table('user_skills').insert(new_skill).execute()
                        if result.data:
                            added_skills.append(skill_name)
                    except Exception as e:
                        logger.error(f"Error adding skill {skill_name}: {str(e)}")
                        skipped_skills.append(skill_name)
                else:
                    skipped_skills.append(skill_name)
        
        return {
            "message": "Resume parsed successfully",
            "parse_result": {
                "total_skills_found": parse_result['total_skills_found'],
                "skills": parse_result['skills'],
                "categorized_skills": parse_result['categorized_skills']
            },
            "auto_add_result": {
                "added_count": len(added_skills),
                "skipped_count": len(skipped_skills),
                "added_skills": added_skills,
                "skipped_skills": skipped_skills
            } if auto_add else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/search", response_model=List[dict])
async def search_skills(skill_name: str, skill_type: str = "offered"):
    """Search for users by skill"""
    try:
        db = get_db()
        
        # Get users with the specified skill
        skills_result = db.table('user_skills').select('user_id, skill_name, skill_level, is_verified').eq('skill_name', skill_name).eq('skill_type', skill_type).execute()
        
        if not skills_result.data:
            return []
        
        # Get user details for each skill
        user_ids = [skill['user_id'] for skill in skills_result.data]
        users_result = db.table('users').select('id, username, full_name, profile_photo, average_rating, total_ratings, bio').in_('id', user_ids).execute()
        
        # Merge skill and user data
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for skill in skills_result.data:
            user = users_dict.get(skill['user_id'])
            if user:
                results.append({
                    'user': user,
                    'skill_level': skill['skill_level'],
                    'is_verified': skill['is_verified']
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error searching skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{skill_id}")
async def delete_skill(skill_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete a skill from user profile"""
    try:
        db = get_db()
        
        # Verify skill belongs to user
        skill_result = db.table('user_skills').select('*').eq('id', skill_id).eq('user_id', current_user_id).execute()
        
        if not skill_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found or doesn't belong to you"
            )
        
        # Delete skill
        db.table('user_skills').delete().eq('id', skill_id).execute()
        
        return {"message": "Skill deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{skill_id}")
async def update_skill(skill_id: str, skill_data: SkillCreate, current_user_id: str = Depends(get_current_user)):
    """Update a skill"""
    try:
        db = get_db()
        
        # Verify skill belongs to user
        skill_result = db.table('user_skills').select('*').eq('id', skill_id).eq('user_id', current_user_id).execute()
        
        if not skill_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found or doesn't belong to you"
            )
        
        # Update skill
        update_data = {
            'skill_name': skill_data.skill_name,
            'skill_type': skill_data.skill_type,
            'skill_level': skill_data.skill_level,
            'description': skill_data.description if hasattr(skill_data, 'description') else None,
            'years_experience': skill_data.years_experience if hasattr(skill_data, 'years_experience') else None,
            'hourly_rate': skill_data.hourly_rate if hasattr(skill_data, 'hourly_rate') else None,
        }
        
        result = db.table('user_skills').update(update_data).eq('id', skill_id).execute()
        
        return {
            "message": "Skill updated successfully",
            "skill": result.data[0] if result.data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=List[SkillResponse])
async def get_user_skills(user_id: str):
    """Get all skills for a specific user"""
    try:
        db = get_db()
        
        result = db.table('user_skills').select('*').eq('user_id', user_id).execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching user skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.get("/recommendations", response_model=List[dict])
async def get_skill_recommendations(current_user_id: str = Depends(get_current_user)):
    """
    Get skill recommendations based on user's existing skills.
    Uses both predefined mappings and AI-powered suggestions.
    """
    try:
        db = get_db()
        
        # Get user's current skills
        user_skills_result = db.table('user_skills').select('skill_name').eq('user_id', current_user_id).execute()
        
        if not user_skills_result.data:
            # If no skills, return popular beginner skills
            return [
                {"skill_name": "HTML", "category": "Web Development", "description": "Foundation of web development", "source": "default"},
                {"skill_name": "CSS", "category": "Web Development", "description": "Style and layout for websites", "source": "default"},
                {"skill_name": "Python", "category": "Programming", "description": "Versatile programming language", "source": "default"},
                {"skill_name": "JavaScript", "category": "Web Development", "description": "Interactive web programming", "source": "default"},
                {"skill_name": "Git", "category": "Development Tools", "description": "Version control system", "source": "default"}
            ]
        
        # Extract skill names
        user_skills = [s['skill_name'] for s in user_skills_result.data]
        
        # Get combined suggestions (predefined + AI)
        suggestions = skill_suggestion_service.get_combined_suggestions(user_skills, include_ai=True)
        
        return suggestions
    
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/suggestions", response_model=List[dict])
async def get_skill_suggestions_for_want_to_learn(current_user_id: str = Depends(get_current_user)):
    """
    Get skill suggestions specifically for "Want to Learn" based on user's "Can Teach" skills.
    This endpoint implements the flow shown in the image:
    - Fetch user's "Can Teach" (offered) skills
    - Display suggestions at the top of "Want to Learn" form
    - Return clickable suggestions
    """
    try:
        db = get_db()
        
        # Get user's "Can Teach" (offered) skills only
        offered_skills_result = db.table('user_skills').select('skill_name').eq('user_id', current_user_id).eq('skill_type', 'offered').execute()
        
        if not offered_skills_result.data:
            # If no "Can Teach" skills, return empty or beginner suggestions
            return [
                {"skill_name": "Web Development Basics", "category": "Web Development", "description": "Start your learning journey", "source": "default"},
                {"skill_name": "Programming Fundamentals", "category": "Programming", "description": "Core programming concepts", "source": "default"},
            ]
        
        # Extract "Can Teach" skill names
        can_teach_skills = [s['skill_name'] for s in offered_skills_result.data]
        
        # Get user's "Want to Learn" skills to avoid duplicates
        wanted_skills_result = db.table('user_skills').select('skill_name').eq('user_id', current_user_id).eq('skill_type', 'wanted').execute()
        wanted_skills_names = {s['skill_name'].lower() for s in wanted_skills_result.data} if wanted_skills_result.data else set()
        
        # Get combined suggestions
        suggestions = skill_suggestion_service.get_combined_suggestions(can_teach_skills, include_ai=True)
        
        # Filter out skills user already wants to learn
        filtered_suggestions = [
            s for s in suggestions 
            if s['skill_name'].lower() not in wanted_skills_names
        ]
        
        return filtered_suggestions[:10]  # Limit to top 10
    
    except Exception as e:
        logger.error(f"Error getting skill suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.get("/mentor-learner-matches", response_model=dict)
async def get_mentor_learner_matches(current_user_id: str = Depends(get_current_user)):
    """
    Smart recommendation system for mentor/learner matching.
    
    Returns:
    - recommended_mentors: Users who can teach what current user wants to learn
    - recommended_learners: Users who want to learn what current user can teach
    
    Each match includes full user profile with ratings, experience, bio, and availability.
    """
    try:
        db = get_db()
        
        # Get current user's skills
        user_skills_result = db.table('user_skills').select('*').eq('user_id', current_user_id).execute()
        
        if not user_skills_result.data:
            return {
                "recommended_mentors": [],
                "recommended_learners": []
            }
        
        # Separate user's skills by type
        user_offered_skills = [s for s in user_skills_result.data if s['skill_type'] == 'offered']
        user_wanted_skills = [s for s in user_skills_result.data if s['skill_type'] == 'wanted']
        
        recommended_mentors = []
        recommended_learners = []
        
        # Find mentors (users who offer skills that current user wants to learn)
        if user_wanted_skills:
            wanted_skill_names = [s['skill_name'].lower() for s in user_wanted_skills]
            
            # Get all users who offer these skills (excluding current user)
            for skill_name in wanted_skill_names:
                mentors_result = db.table('user_skills').select('*, users:user_id(*)').eq('skill_type', 'offered').ilike('skill_name', skill_name).neq('user_id', current_user_id).execute()
                
                if mentors_result.data:
                    for mentor_skill in mentors_result.data:
                        user_data = mentor_skill.get('users')
                        if user_data:
                            # Get user's rating stats
                            rating_result = db.table('reviews').select('rating').eq('reviewed_user_id', mentor_skill['user_id']).execute()
                            
                            ratings = [r['rating'] for r in rating_result.data] if rating_result.data else []
                            avg_rating = sum(ratings) / len(ratings) if ratings else 0
                            
                            # Get session count
                            session_result = db.table('sessions').select('id', count='exact').eq('mentor_id', mentor_skill['user_id']).eq('status', 'completed').execute()
                            
                            session_count = session_result.count if hasattr(session_result, 'count') and session_result.count else 0
                            
                            mentor_info = {
                                "user_id": mentor_skill['user_id'],
                                "username": user_data.get('username', ''),
                                "full_name": user_data.get('full_name', ''),
                                "email": user_data.get('email', ''),
                                "bio": user_data.get('bio', ''),
                                "avatar_url": user_data.get('avatar_url', ''),
                                "is_available": user_data.get('is_available', True),
                                "location": user_data.get('location', ''),
                                "skill_name": mentor_skill['skill_name'],
                                "skill_level": mentor_skill['skill_level'],
                                "skill_id": mentor_skill['id'],
                                "description": mentor_skill.get('description', ''),
                                "years_experience": mentor_skill.get('years_experience', 0),
                                "hourly_rate": mentor_skill.get('hourly_rate', 0),
                                "is_verified": mentor_skill.get('is_verified', False),
                                "average_rating": round(avg_rating, 2),
                                "total_sessions": session_count,
                                "total_reviews": len(ratings)
                            }
                            
                            # Avoid duplicates
                            if not any(m['user_id'] == mentor_info['user_id'] and m['skill_name'] == mentor_info['skill_name'] for m in recommended_mentors):
                                recommended_mentors.append(mentor_info)
        
        # Find learners (users who want to learn skills that current user offers)
        if user_offered_skills:
            offered_skill_names = [s['skill_name'].lower() for s in user_offered_skills]
            
            # Get all users who want these skills (excluding current user)
            for skill_name in offered_skill_names:
                learners_result = db.table('user_skills').select('*, users:user_id(*)').eq('skill_type', 'wanted').ilike('skill_name', skill_name).neq('user_id', current_user_id).execute()
                
                if learners_result.data:
                    for learner_skill in learners_result.data:
                        user_data = learner_skill.get('users')
                        if user_data:
                            learner_info = {
                                "user_id": learner_skill['user_id'],
                                "username": user_data.get('username', ''),
                                "full_name": user_data.get('full_name', ''),
                                "email": user_data.get('email', ''),
                                "bio": user_data.get('bio', ''),
                                "avatar_url": user_data.get('avatar_url', ''),
                                "is_available": user_data.get('is_available', True),
                                "location": user_data.get('location', ''),
                                "skill_name": learner_skill['skill_name'],
                                "skill_level": learner_skill['skill_level'],
                                "skill_id": learner_skill['id'],
                                "description": learner_skill.get('description', ''),
                            }
                            
                            # Avoid duplicates
                            if not any(l['user_id'] == learner_info['user_id'] and l['skill_name'] == learner_info['skill_name'] for l in recommended_learners):
                                recommended_learners.append(learner_info)
        
        # Sort mentors by rating and verification status
        recommended_mentors.sort(key=lambda x: (x['is_verified'], x['average_rating'], x['total_sessions']), reverse=True)
        
        return {
            "recommended_mentors": recommended_mentors[:20],  # Limit to top 20
            "recommended_learners": recommended_learners[:20]
        }
    
    except Exception as e:
        logger.error(f"Error getting mentor/learner matches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )