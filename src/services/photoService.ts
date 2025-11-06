import { supabase } from '../lib/supabase';

export interface Photo {
  id: string;
  user_id: string;
  album_id?: string;
  title?: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  tags: string[];
  location?: string;
  taken_at?: string;
  uploaded_at: string;
  is_favorite: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_photo_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadPhotoData {
  file: File;
  albumId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  location?: string;
  takenAt?: string;
}

export const photoService = {
  async uploadPhoto(data: UploadPhotoData): Promise<Photo> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const fileExt = data.file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, data.file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    const { data: photo, error: insertError } = await supabase
      .from('photos')
      .insert({
        user_id: user.id,
        album_id: data.albumId,
        title: data.title,
        description: data.description,
        file_url: publicUrl,
        file_size: data.file.size,
        mime_type: data.file.type,
        tags: data.tags || [],
        location: data.location,
        taken_at: data.takenAt,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return photo;
  },

  async getPhotos(albumId?: string): Promise<Photo[]> {
    let query = supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (albumId) {
      query = query.eq('album_id', albumId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  },

  async getPhoto(id: string): Promise<Photo> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  },

  async updatePhoto(
    id: string,
    updates: Partial<Pick<Photo, 'title' | 'description' | 'tags' | 'location' | 'is_favorite'>>
  ): Promise<Photo> {
    const { data, error } = await supabase
      .from('photos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async deletePhoto(id: string): Promise<void> {
    const photo = await this.getPhoto(id);

    const fileName = photo.file_url.split('/').slice(-2).join('/');

    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([fileName]);

    if (storageError) throw storageError;

    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
  },

  async toggleFavorite(id: string, isFavorite: boolean): Promise<Photo> {
    return this.updatePhoto(id, { is_favorite: isFavorite });
  },

  async searchPhotos(query: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  },

  async getFavorites(): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  },

  async createAlbum(name: string, description?: string, isPublic = false): Promise<Album> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('albums')
      .insert({
        user_id: user.id,
        name,
        description,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async getAlbums(): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  },

  async getAlbum(id: string): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  },

  async updateAlbum(
    id: string,
    updates: Partial<Pick<Album, 'name' | 'description' | 'cover_photo_url' | 'is_public'>>
  ): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async deleteAlbum(id: string): Promise<void> {
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async movePhotoToAlbum(photoId: string, albumId: string | null): Promise<Photo> {
    return this.updatePhoto(photoId, { album_id: albumId } as any);
  },
};
