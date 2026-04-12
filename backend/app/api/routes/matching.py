from fastapi import APIRouter, HTTPException, Depends
from app.utils.auth import get_current_user
from app.database import get_db
from app.ai.groq_service import groq_service
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/match", tags=["Matching"])


def get_match_type(user_a_teach, user_a_learn, user_b_teach, user_b_learn):
    """Determine match type between two users"""
    teach_a = [s.lower() for s in user_a_teach]
    learn_a = [s.lower() for s in user_a_learn]
    teach_b = [s.lower() for s in user_b_teach]
    learn_b = [s.lower() for s in user_b_learn]

    is_mutual = (
        any(skill in learn_b for skill in teach_a) and
        any(skill in learn_a for skill in teach_b)
    )
    is_mentor = any(skill in teach_b for skill in learn_a)
    is_learner = any(skill in learn_b for skill in teach_a)

    if is_mutual:
        return "perfect"
    if is_mentor:
        return "mentor"
    if is_learner:
        return "learner"
    return None


def find_matching_skills(list_a, list_b):
    """Find common skills between two lists (case-insensitive)"""
    set_a = {s.lower() for s in list_a}
    set_b = {s.lower() for s in list_b}
    return list(set_a & set_b)


@router.get("/mentors")
async def get_recommended_mentors(current_user_id: str = Depends(get_current_user)):
    """Get users who can teach what current user wants to learn, enhanced with AI"""
    try:
        db = get_db()

        # Get current user's skills
        user_skills = db.table('user_skills').select('*').eq('user_id', current_user_id).execute()
        if not user_skills.data:
            return {"mentors": [], "ai_suggestions": []}

        wanted_skills = [s['skill_name'] for s in user_skills.data if s['skill_type'] == 'wanted']
        if not wanted_skills:
            return {"mentors": [], "ai_suggestions": []}

        # Find users who offer these skills
        mentors_map = {}
        for skill_name in wanted_skills:
            result = db.table('user_skills').select(
                '*, users:user_id(*)'
            ).eq('skill_type', 'offered').ilike('skill_name', skill_name).neq('user_id', current_user_id).execute()

            if result.data:
                for entry in result.data:
                    user_data = entry.get('users')
                    if not user_data:
                        continue
                    uid = entry['user_id']
                    if uid not in mentors_map:
                        mentors_map[uid] = {
                            "user_id": uid,
                            "username": user_data.get('username', ''),
                            "full_name": user_data.get('full_name', ''),
                            "email": user_data.get('email', ''),
                            "bio": user_data.get('bio', ''),
                            "profile_photo": user_data.get('profile_photo', ''),
                            "background_photo": user_data.get('background_photo', ''),
                            "avatar_url": user_data.get('avatar_url', ''),
                            "is_available": user_data.get('is_available', True),
                            "location": user_data.get('location', ''),
                            "matching_skills": [],
                            "skill_level": entry.get('skill_level', 'intermediate'),
                            "is_verified": entry.get('is_verified', False),
                            "match_type": "mentor",
                        }
                    if entry['skill_name'] not in mentors_map[uid]['matching_skills']:
                        mentors_map[uid]['matching_skills'].append(entry['skill_name'])

        mentors = list(mentors_map.values())

        # AI-enhanced: Get additional skill suggestions
        ai_suggestions = []
        try:
            ai_result = await groq_service.get_skill_recommendations(wanted_skills, limit=3)
            ai_suggestions = ai_result if ai_result else []
        except Exception as e:
            logger.warning(f"AI suggestion failed: {e}")

        return {"mentors": mentors[:20], "ai_suggestions": ai_suggestions}

    except Exception as e:
        logger.error(f"Error getting mentor matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/learners")
async def get_recommended_learners(current_user_id: str = Depends(get_current_user)):
    """Get users who want to learn what current user can teach"""
    try:
        db = get_db()

        user_skills = db.table('user_skills').select('*').eq('user_id', current_user_id).execute()
        if not user_skills.data:
            return {"learners": []}

        offered_skills = [s['skill_name'] for s in user_skills.data if s['skill_type'] == 'offered']
        if not offered_skills:
            return {"learners": []}

        learners_map = {}
        for skill_name in offered_skills:
            result = db.table('user_skills').select(
                '*, users:user_id(*)'
            ).eq('skill_type', 'wanted').ilike('skill_name', skill_name).neq('user_id', current_user_id).execute()

            if result.data:
                for entry in result.data:
                    user_data = entry.get('users')
                    if not user_data:
                        continue
                    uid = entry['user_id']
                    if uid not in learners_map:
                        learners_map[uid] = {
                            "user_id": uid,
                            "username": user_data.get('username', ''),
                            "full_name": user_data.get('full_name', ''),
                            "email": user_data.get('email', ''),
                            "bio": user_data.get('bio', ''),
                            "profile_photo": user_data.get('profile_photo', ''),
                            "background_photo": user_data.get('background_photo', ''),
                            "avatar_url": user_data.get('avatar_url', ''),
                            "is_available": user_data.get('is_available', True),
                            "location": user_data.get('location', ''),
                            "matching_skills": [],
                            "skill_level": entry.get('skill_level', 'beginner'),
                            "match_type": "learner",
                        }
                    if entry['skill_name'] not in learners_map[uid]['matching_skills']:
                        learners_map[uid]['matching_skills'].append(entry['skill_name'])

        return {"learners": list(learners_map.values())[:20]}

    except Exception as e:
        logger.error(f"Error getting learner matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/perfect")
async def get_perfect_matches(current_user_id: str = Depends(get_current_user)):
    """
    Get perfect skill exchange matches - mutual matches where:
    User A teaches what User B wants AND User B teaches what User A wants.
    Enhanced with AI scoring.
    """
    try:
        db = get_db()

        # Get current user's skills
        user_skills = db.table('user_skills').select('*').eq('user_id', current_user_id).execute()
        if not user_skills.data:
            logger.info(f"No skills found for user {current_user_id}")
            return {"perfect_matches": [], "debug": {"user_skills": []}}

        my_teach = [s['skill_name'] for s in user_skills.data if s['skill_type'] == 'offered']
        my_learn = [s['skill_name'] for s in user_skills.data if s['skill_type'] == 'wanted']

        logger.info(f"User {current_user_id} - Can teach: {my_teach}, Wants to learn: {my_learn}")

        if not my_teach or not my_learn:
            return {
                "perfect_matches": [], 
                "debug": {
                    "user_id": current_user_id,
                    "my_teach": my_teach,
                    "my_learn": my_learn,
                    "message": "Need both offered and wanted skills for perfect matches"
                }
            }
            return {"perfect_matches": []}

        # Find potential matches - users who want what I teach
        potential_user_ids = set()
        for skill in my_teach:
            result = db.table('user_skills').select('user_id').eq(
                'skill_type', 'wanted'
            ).ilike('skill_name', skill).neq('user_id', current_user_id).execute()
            if result.data:
                for entry in result.data:
                    potential_user_ids.add(entry['user_id'])
                logger.info(f"Found {len(result.data)} users wanting skill '{skill}'")

        logger.info(f"Potential match candidates: {len(potential_user_ids)} users")

        if not potential_user_ids:
            return {
                "perfect_matches": [], 
                "debug": {
                    "my_teach": my_teach,
                    "my_learn": my_learn,
                    "potential_users": 0,
                    "message": "No users found who want what you teach"
                }
            }

        # Check each potential user for mutual match
        perfect_matches = []
        for uid in potential_user_ids:
            other_skills = db.table('user_skills').select('*').eq('user_id', uid).execute()
            if not other_skills.data:
                continue

            other_teach = [s['skill_name'] for s in other_skills.data if s['skill_type'] == 'offered']
            other_learn = [s['skill_name'] for s in other_skills.data if s['skill_type'] == 'wanted']

            match_type = get_match_type(my_teach, my_learn, other_teach, other_learn)
            logger.info(f"Checking user {uid}: their teach={other_teach}, their learn={other_learn}, match_type={match_type}")


            if match_type == "perfect":
                # Get user info
                user_result = db.table('users').select('*').eq('id', uid).execute()
                if not user_result.data:
                    continue
                user_data = user_result.data[0]

                # Find the matching skills in both directions
                i_teach_they_want = find_matching_skills(my_teach, other_learn)
                they_teach_i_want = find_matching_skills(other_teach, my_learn)
                logger.info(f"PERFECT MATCH FOUND with {user_data.get('username')}: I teach {i_teach_they_want}, they teach {they_teach_i_want}")

                perfect_matches.append({
                    "user_id": uid,
                    "username": user_data.get('username', ''),
                    "full_name": user_data.get('full_name', ''),
                    "email": user_data.get('email', ''),
                    "bio": user_data.get('bio', ''),
                    "profile_photo": user_data.get('profile_photo', ''),
                    "background_photo": user_data.get('background_photo', ''),
                    "avatar_url": user_data.get('avatar_url', ''),
                    "is_available": user_data.get('is_available', True),
                    "location": user_data.get('location', ''),
                    "match_type": "perfect",
                    "you_teach": i_teach_they_want,
                    "they_teach": they_teach_i_want,
                    "match_score": len(i_teach_they_want) + len(they_teach_i_want),
                })

        # Sort by match score
        perfect_matches.sort(key=lambda x: x['match_score'], reverse=True)

        # AI enhancement: Generate match insights
        ai_insights = []
        if perfect_matches:
            try:
                top_match = perfect_matches[0]
                prompt = f"In 1-2 sentences, explain why exchanging skills '{', '.join(top_match['you_teach'])}' for '{', '.join(top_match['they_teach'])}' is a great learning opportunity."
                messages = [
                    {"role": "system", "content": "You are a brief, enthusiastic skill exchange advisor."},
                    {"role": "user", "content": prompt}
                ]
                insight = await groq_service.chat_completion(messages, temperature=0.7, max_tokens=100)
                ai_insights.append({"match_user_id": top_match['user_id'], "insight": insight})
            except Exception as e:
                logger.warning(f"AI insight failed: {e}")

        return {
            "perfect_matches": perfect_matches[:20],
            "ai_insights": ai_insights,
            "total_count": len(perfect_matches)
        }

    except Exception as e:
        logger.error(f"Error getting perfect matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all")
async def get_all_matches(current_user_id: str = Depends(get_current_user)):
    """Get all match types (mentors, learners, perfect) in one call"""
    try:
        db = get_db()

        user_skills = db.table('user_skills').select('*').eq('user_id', current_user_id).execute()
        if not user_skills.data:
            return {
                "mentors": [],
                "learners": [],
                "perfect_matches": [],
            }

        my_teach = [s['skill_name'] for s in user_skills.data if s['skill_type'] == 'offered']
        my_learn = [s['skill_name'] for s in user_skills.data if s['skill_type'] == 'wanted']

        # Gather all potential users
        all_user_ids = set()

        # Users who teach what I want
        for skill in my_learn:
            result = db.table('user_skills').select('user_id').eq(
                'skill_type', 'offered'
            ).ilike('skill_name', skill).neq('user_id', current_user_id).execute()
            if result.data:
                for e in result.data:
                    all_user_ids.add(e['user_id'])

        # Users who want what I teach
        for skill in my_teach:
            result = db.table('user_skills').select('user_id').eq(
                'skill_type', 'wanted'
            ).ilike('skill_name', skill).neq('user_id', current_user_id).execute()
            if result.data:
                for e in result.data:
                    all_user_ids.add(e['user_id'])

        mentors = []
        learners = []
        perfect_matches = []

        for uid in all_user_ids:
            other_skills = db.table('user_skills').select('*').eq('user_id', uid).execute()
            if not other_skills.data:
                continue

            other_teach = [s['skill_name'] for s in other_skills.data if s['skill_type'] == 'offered']
            other_learn = [s['skill_name'] for s in other_skills.data if s['skill_type'] == 'wanted']

            match_type = get_match_type(my_teach, my_learn, other_teach, other_learn)
            if not match_type:
                continue

            user_result = db.table('users').select('*').eq('id', uid).execute()
            if not user_result.data:
                continue
            ud = user_result.data[0]

            base_info = {
                "user_id": uid,
                "username": ud.get('username', ''),
                "full_name": ud.get('full_name', ''),
                "bio": ud.get('bio', ''),
                "profile_photo": ud.get('profile_photo', ''),
                "background_photo": ud.get('background_photo', ''),
                "avatar_url": ud.get('avatar_url', ''),
                "is_available": ud.get('is_available', True),
                "location": ud.get('location', ''),
                "match_type": match_type,
            }

            if match_type == "perfect":
                base_info["you_teach"] = find_matching_skills(my_teach, other_learn)
                base_info["they_teach"] = find_matching_skills(other_teach, my_learn)
                base_info["match_score"] = len(base_info["you_teach"]) + len(base_info["they_teach"])
                perfect_matches.append(base_info)
            elif match_type == "mentor":
                base_info["matching_skills"] = find_matching_skills(my_learn, other_teach)
                mentors.append(base_info)
            elif match_type == "learner":
                base_info["matching_skills"] = find_matching_skills(my_teach, other_learn)
                learners.append(base_info)

        perfect_matches.sort(key=lambda x: x.get('match_score', 0), reverse=True)

        return {
            "mentors": mentors[:20],
            "learners": learners[:20],
            "perfect_matches": perfect_matches[:20],
        }

    except Exception as e:
        logger.error(f"Error getting all matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))
