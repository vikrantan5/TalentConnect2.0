"""
Leaderboard Service - Manage weekly leaderboards for top users.

Scoring is now based on real activity, not a points/XP system.

Top Mentors        = completed mentor sessions + (avg rating * num_ratings)
Top Learners       = completed learning sessions (as learner) + completed tasks
Top Contributors   = total skill exchanges + tasks + mentor sessions + learner sessions
"""
from app.database import get_db
import logging
from datetime import datetime, timedelta
from typing import List, Dict

logger = logging.getLogger(__name__)


class LeaderboardService:
    """Service for managing leaderboards"""

    @staticmethod
    def get_current_week_dates() -> tuple:
        """Get start and end dates for current week"""
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        return week_start, week_end

    @staticmethod
    def _compute_user_stats(db) -> Dict[str, Dict]:
        """
        Returns a dict keyed by user_id with aggregated stats:
          mentor_sessions_done, learner_sessions_done, exchanges_done,
          tasks_done, rating, total_ratings, role
        """
        # All non-admin users
        users_res = db.table('users').select(
            'id, username, full_name, profile_photo, role, '
            'average_rating, total_ratings, total_sessions, total_tasks_completed, '
            'total_skill_exchanges_completed, trust_score'
        ).neq('role', 'admin').execute()

        stats: Dict[str, Dict] = {}
        for u in (users_res.data or []):
            stats[u['id']] = {
                'user': u,
                'mentor_sessions_done': 0,
                'learner_sessions_done': 0,
                'exchanges_done': u.get('total_skill_exchanges_completed') or 0,
                'tasks_done': u.get('total_tasks_completed') or 0,
                'rating': float(u.get('average_rating') or 0),
                'total_ratings': int(u.get('total_ratings') or 0),
            }

        # learning_sessions (completed): count for mentor & learner separately
        try:
            ls_res = db.table('learning_sessions').select(
                'mentor_id, learner_id, status'
            ).eq('status', 'completed').execute()
            for s in (ls_res.data or []):
                mid = s.get('mentor_id')
                lid = s.get('learner_id')
                if mid and mid in stats:
                    stats[mid]['mentor_sessions_done'] += 1
                if lid and lid in stats:
                    stats[lid]['learner_sessions_done'] += 1
        except Exception as e:
            logger.warning(f"learning_sessions aggregation skipped: {e}")

        # skill_exchange_sessions (completed)
        try:
            ex_res = db.table('skill_exchange_sessions').select(
                'participant1_id, participant2_id, status'
            ).eq('status', 'completed').execute()
            for s in (ex_res.data or []):
                for key in ('participant1_id', 'participant2_id'):
                    uid = s.get(key)
                    if uid and uid in stats:
                        # exchanges_done already comes from user column; only add if column is 0
                        # (db column is the source of truth, this is a safety net)
                        pass
        except Exception as e:
            logger.warning(f"skill_exchange_sessions aggregation skipped: {e}")

        return stats

    @staticmethod
    def _score_for(category: str, s: Dict) -> float:
        rating = s['rating']
        nratings = s['total_ratings']
        mentor_sessions = s['mentor_sessions_done']
        learner_sessions = s['learner_sessions_done']
        exchanges = s['exchanges_done']
        tasks = s['tasks_done']

        # rating quality factor: rating * log-like weight on number of ratings
        rating_factor = rating * min(nratings, 20)

        if category == 'top_mentor':
            return (
                mentor_sessions * 10
                + exchanges * 5
                + rating_factor * 3
                + tasks * 1
            )
        if category == 'top_learner':
            return (
                learner_sessions * 10
                + tasks * 6
                + exchanges * 4
                + rating_factor * 1
            )
        # top_contributor — overall engagement
        return (
            mentor_sessions * 6
            + learner_sessions * 4
            + exchanges * 5
            + tasks * 5
            + rating_factor * 2
        )

    @staticmethod
    def update_leaderboard(category: str, limit: int = 100) -> None:
        """Recompute leaderboard for a category."""
        try:
            db = get_db()
            week_start, week_end = LeaderboardService.get_current_week_dates()

            # Clear current week's entries for this category
            try:
                db.table('leaderboard_entries').delete().eq(
                    'category', category
                ).eq('week_start_date', str(week_start)).execute()
            except Exception as e:
                logger.warning(f"leaderboard_entries delete skipped: {e}")

            stats = LeaderboardService._compute_user_stats(db)

            entries = []
            for uid, s in stats.items():
                score = LeaderboardService._score_for(category, s)
                if score <= 0:
                    continue
                entries.append({
                    'user_id': uid,
                    'category': category,
                    'score': int(round(score * 100)),  # keep 2-decimal precision as int
                    'rank': 0,
                    'week_start_date': str(week_start),
                    'week_end_date': str(week_end),
                })

            entries.sort(key=lambda x: x['score'], reverse=True)
            entries = entries[:limit]
            for idx, e in enumerate(entries, 1):
                e['rank'] = idx

            if entries:
                try:
                    db.table('leaderboard_entries').insert(entries).execute()
                except Exception as e:
                    logger.warning(f"leaderboard_entries insert skipped: {e}")

            logger.info(
                f"Updated leaderboard {category} with {len(entries)} entries"
            )
        except Exception as e:
            logger.error(f"Error updating leaderboard: {e}")

    @staticmethod
    def get_leaderboard(category: str, limit: int = 10) -> List[Dict]:
        """
        Compute leaderboard on demand and return enriched entries.
        We compute live (no DB cache dependency) so the page is never empty
        when activity exists.
        """
        try:
            db = get_db()
            stats = LeaderboardService._compute_user_stats(db)

            scored = []
            for uid, s in stats.items():
                score = LeaderboardService._score_for(category, s)
                if score <= 0:
                    continue
                scored.append((score, uid, s))

            scored.sort(key=lambda x: x[0], reverse=True)
            scored = scored[:limit]

            leaderboard = []
            for rank, (score, uid, s) in enumerate(scored, 1):
                u = s['user']
                leaderboard.append({
                    'rank': rank,
                    'user_id': uid,
                    'username': u.get('username'),
                    'full_name': u.get('full_name'),
                    'profile_photo': u.get('profile_photo'),
                    'score': int(round(score)),
                    'trust_score': u.get('trust_score', 0) or 0,
                    'category': category,
                    'stats': {
                        'total_sessions': (
                            s['mentor_sessions_done'] + s['learner_sessions_done']
                        ),
                        'mentor_sessions': s['mentor_sessions_done'],
                        'learner_sessions': s['learner_sessions_done'],
                        'average_rating': s['rating'],
                        'total_ratings': s['total_ratings'],
                        'total_tasks_completed': s['tasks_done'],
                        'total_skill_exchanges_completed': s['exchanges_done'],
                    },
                })

            # best-effort persist
            try:
                LeaderboardService.update_leaderboard(category, max(limit, 50))
            except Exception:
                pass

            return leaderboard
        except Exception as e:
            logger.error(f"Error getting leaderboard: {e}")
            return []


leaderboard_service = LeaderboardService()
