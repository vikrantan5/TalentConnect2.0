import React, { useState } from 'react';
import { X, Star, Send, Loader2 } from 'lucide-react';
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

  const tone = (n) => {
    if (n === 5) return 'Excellent';
    if (n === 4) return 'Very good';
    if (n === 3) return 'Good';
    if (n === 2) return 'Fair';
    return 'Poor';
  };

  return (
    <div
      className="tc-modal-backdrop flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bento rounded-[28px] max-w-md w-full overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-ink-950 text-white p-7 overflow-hidden">
          <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(500px 300px at 100% -10%, rgba(255,193,7,.32), transparent 60%), radial-gradient(400px 250px at -10% 110%, rgba(255,106,91,.28), transparent 60%)' }} />
          <div className="relative flex justify-between items-start">
            <div>
              <span className="chip chip-coral mb-2"><Star className="w-3 h-3" /> rate experience</span>
              <h2 className="font-display text-3xl leading-tight">
                How was it with <span className="italic text-gradient">{receiverName}</span>?
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3 text-center">
              Select rating *
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
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-ink-200 dark:text-ink-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center mt-3 font-display text-2xl text-gradient-cyan">
                {tone(rating)}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
              Write a review (optional)
            </label>
            <textarea
              rows="4"
              className="modern-input resize-none"
              placeholder="Share your experience…"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength="500"
              data-testid="review-textarea"
            ></textarea>
            <p className="text-[11px] text-ink-500 dark:text-ink-300 mt-1 text-right">
              {review.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="chip chip-coral w-full justify-center py-2">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 btn btn-ghost py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 btn btn-coral py-3 disabled:opacity-50"
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
                  Submit
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
