import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, ThumbsUp, MessageSquare, CheckCircle, User } from 'lucide-react';

interface Review {
  id: string;
  reviewer_id: string;
  rating: number;
  cleanliness_rating: number | null;
  location_rating: number | null;
  value_rating: number | null;
  amenities_rating: number | null;
  comment: string;
  pros: string | null;
  cons: string | null;
  images: string[];
  helpful_count: number;
  response_from_owner: string | null;
  response_date: string | null;
  verified_stay: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface PropertyReviewsProps {
  propertyId: string;
  averageRating?: number;
  reviewCount?: number;
}

export default function PropertyReviews({ propertyId, averageRating = 0, reviewCount = 0 }: PropertyReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  useEffect(() => {
    loadReviews();
  }, [propertyId, sortBy]);

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('property_reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('property_id', propertyId);

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('rating', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600 mx-auto"></div>
      </div>
    );
  }

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      <div className="card-scrapbook p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Avis des locataires</h2>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(averageRating), 'lg')}
            <p className="text-gray-600 mt-2">{reviewCount} avis</p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star as keyof typeof distribution];
              const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

              return (
                <div key={star} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 w-12">{star} étoiles</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">{reviews.length} avis</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
              className="input-scrapbook w-auto"
            >
              <option value="recent">Plus récents</option>
              <option value="rating">Mieux notés</option>
            </select>
          </div>
        )}

        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="pb-6 border-b border-gray-200 last:border-0">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  {review.profiles.avatar_url ? (
                    <img
                      src={review.profiles.avatar_url}
                      alt={review.profiles.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{review.profiles.full_name}</span>
                      {review.verified_stay && (
                        <span className="inline-flex items-center space-x-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          <span>Séjour vérifié</span>
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                </div>
              </div>

              {(review.cleanliness_rating || review.location_rating || review.value_rating || review.amenities_rating) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {review.cleanliness_rating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Propreté</p>
                      {renderStars(review.cleanliness_rating, 'sm')}
                    </div>
                  )}
                  {review.location_rating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Emplacement</p>
                      {renderStars(review.location_rating, 'sm')}
                    </div>
                  )}
                  {review.value_rating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Rapport qualité/prix</p>
                      {renderStars(review.value_rating, 'sm')}
                    </div>
                  )}
                  {review.amenities_rating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Équipements</p>
                      {renderStars(review.amenities_rating, 'sm')}
                    </div>
                  )}
                </div>
              )}

              <p className="text-gray-700 mb-3">{review.comment}</p>

              {review.pros && (
                <div className="mb-2">
                  <p className="text-sm font-bold text-green-800 mb-1">Points positifs:</p>
                  <p className="text-sm text-gray-700">{review.pros}</p>
                </div>
              )}

              {review.cons && (
                <div className="mb-3">
                  <p className="text-sm font-bold text-red-800 mb-1">Points à améliorer:</p>
                  <p className="text-sm text-gray-700">{review.cons}</p>
                </div>
              )}

              {review.images.length > 0 && (
                <div className="flex space-x-2 mb-3">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Review photo ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-75"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}

              {review.response_from_owner && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900 mb-1">Réponse du propriétaire</p>
                      <p className="text-sm text-gray-700">{review.response_from_owner}</p>
                      {review.response_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.response_date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 mt-3">
                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-terracotta-600">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Utile ({review.helpful_count})</span>
                </button>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">Aucun avis pour le moment</p>
              <p className="text-gray-500">Soyez le premier à laisser un avis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
