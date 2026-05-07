import React, { useState } from 'react';
import { X, Star, Send, Loader2, Sparkles, Award, Heart, ThumbsUp } from 'lucide-react';
import { ratingService } from '../services/apiService';

const RatingModal = ({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  taskId = null,
  sessionId = null,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await ratingService.addRating({
        receiver_id: receiverId,
        task_id: taskId,
        session_id: sessionId,
        rating: rating,
        review: review.trim() || null
      });

      if (onSuccess) onSuccess();
      onClose();

      setRating(0);
      setReview('');
    } catch (err) {
      console.error('Rating submission error:', err);
      setError(err.response?.data?.detail || 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRating(0);
      setReview('');
      setError('');
      onClose();
    }
  };

  const getRatingMessage = (rating) => {
    const messages = {
      1: { text: 'Needs Improvement', icon: Heart, color: 'from-coral-400 to-pink-500' },
      2: { text: 'Fair', icon: Heart, color: 'from-coral-400 to-pink-500' },
      3: { text: 'Good', icon: ThumbsUp, color: 'from-amber-400 to-coral-400' },
      4: { text: 'Very Good', icon: ThumbsUp, color: 'from-emerald-400 to-cyan-500' },
      5: { text: 'Excellent!', icon: Award, color: 'from-cyan-400 to-indigo-500' }
    };
    return messages[rating] || messages[3];
  };

  const ratingMessage = rating > 0 ? getRatingMessage(rating) : null;
  const RatingIcon = ratingMessage?.icon || Award;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm" 
      data-testid="rating-modal" 
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-md max-h-[92vh] overflow-hidden rounded-[28px] bento shadow-soft-lg flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — ink-navy like ReportModal */}
        <div className="relative overflow-hidden bg-ink-950 text-white p-6 flex-shrink-0">
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: 'radial-gradient(500px 300px at 10% -10%, rgba(255,106,91,.32), transparent 60%), radial-gradient(500px 400px at 95% 110%, rgba(34,211,238,.18), transparent 60%)'
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center text-amber-300 backdrop-blur-md">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <span className="chip chip-coral mb-1.5"><Sparkles className="w-3 h-3" /> rate experience</span>
                <h3 className="font-display text-3xl leading-tight">
                  Rate <span className="italic text-gradient">collaboration</span>
                </h3>
                <p className="text-xs text-ink-300 mt-1">Help others make informed decisions.</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              disabled={loading}
              className="w-9 h-9 rounded-full glass grid place-items-center hover:shadow-glow transition disabled:opacity-50" 
              data-testid="close-rating-modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* User info - matching ReportModal style */}
          <div className="rounded-2xl glass p-4">
            <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">Rating for</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white font-bold shadow-soft">
                {receiverName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold">{receiverName}</p>
                <p className="text-xs text-ink-500 dark:text-ink-300">Collaborator</p>
              </div>
            </div>
            {taskId && (
              <p className="mt-3 text-xs text-cyan-600 dark:text-cyan-300">
                Task ID: <b>{taskId}</b>
              </p>
            )}
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3 text-center">
              Select rating <span className="text-coral-500">*</span>
            </label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`w-10 h-10 transition-all ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400 drop-shadow-glow'
                        : 'text-ink-200 dark:text-ink-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {/* Rating message with icon */}
            {rating > 0 && (
              <div className={`mt-4 text-center p-3 rounded-2xl bg-gradient-to-r ${ratingMessage.color} bg-opacity-10 text-white`}>
                <div className="flex items-center justify-center gap-2">
                  <RatingIcon className="w-5 h-5" />
                  <p className="font-display text-xl font-semibold">
                    {ratingMessage.text}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Review Text - matching ReportModal style */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
              Write a review (optional)
            </label>
            <textarea
              rows="4"
              className="modern-input resize-none"
              placeholder="Share your experience… What went well? What could be improved?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength="500"
              data-testid="review-textarea"
            />
            <p className="text-[11px] text-ink-500 dark:text-ink-300 mt-1 text-right">
              {review.length}/500 characters
            </p>
          </div>

          {/* Error message - matching ReportModal style */}
          {error && (
            <div className="p-4 rounded-2xl bg-coral-500/10 ring-1 ring-coral-500/20 text-coral-700 dark:text-coral-300 text-sm">
              {error}
            </div>
          )}

          {/* Important notice - matching ReportModal style */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
            <Heart className="w-5 h-5 text-cyan-600 dark:text-cyan-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-cyan-700 dark:text-cyan-200">Why your rating matters</p>
              <p className="text-xs text-ink-600 dark:text-ink-200 mt-1">
                Your honest feedback helps build trust in our community and helps others make informed decisions.
              </p>
            </div>
          </div>

          {/* Action Buttons - matching ReportModal style */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={handleClose} 
              className="btn btn-ghost flex-1 py-3" 
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-coral flex-1 py-3"
              disabled={loading || rating === 0}
              data-testid="submit-rating-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;