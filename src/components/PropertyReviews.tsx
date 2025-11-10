import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Review {
  id: string;
  user_id: string;
  property_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  helpful_count: number;
}

interface PropertyReviewsProps {
  propertyId: string;
}

export default function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [propertyId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('property_reviews')
        .select(`
          *,
          profiles!property_reviews_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = (data || []).map((review: any) => ({
        id: review.id,
        user_id: review.user_id,
        property_id: review.property_id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        reviewer_name: review.profiles?.full_name || 'Utilisateur anonyme',
        reviewer_avatar: review.profiles?.avatar_url,
        helpful_count: review.helpful_count || 0,
      }));

      setReviews(reviewsData);

      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Aucun avis pour cette propriété</p>
        <p className="text-sm text-gray-500 mt-1">Soyez le premier à laisser un avis!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Avis des locataires</h3>
          <div className="flex items-center space-x-2">
            <div className="flex">{renderStars(Math.round(averageRating))}</div>
            <span className="text-lg font-semibold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-500">({reviews.length} avis)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {review.reviewer_avatar ? (
                  <img
                    src={review.reviewer_avatar}
                    alt={review.reviewer_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-terracotta-500 flex items-center justify-center text-white font-bold">
                    {review.reviewer_name[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {review.reviewer_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex">{renderStars(review.rating)}</div>
                </div>

                <p className="text-gray-700 mb-3">{review.comment}</p>

                <button className="flex items-center space-x-1 text-gray-500 hover:text-terracotta-600 transition-colors">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">Utile ({review.helpful_count})</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
