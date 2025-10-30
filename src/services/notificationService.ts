import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  channels: string[];
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  email_types: string[];
  sms_types: string[];
  whatsapp_types: string[];
  push_types: string[];
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  whatsapp_phone: string | null;
}

export const notificationService = {
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase.rpc('get_unread_notification_count');

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return data || 0;
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId
    });

    if (error) throw error;
    return data || false;
  },

  async markAllAsRead(): Promise<number> {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) throw error;
    return data || 0;
  },

  async createNotification(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    channels?: string[];
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: params.userId,
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_channels: params.channels || ['in_app'],
      p_action_url: params.actionUrl,
      p_action_label: params.actionLabel,
      p_metadata: params.metadata || {},
      p_priority: params.priority || 'normal'
    });

    if (error) throw error;
    return data;
  },

  async getPreferences(): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(preferences);

    if (error) throw error;
  },

  async sendEmail(to: string, template: string, data: Record<string, any>): Promise<void> {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, template, data }
    });

    if (error) throw error;
  },

  async sendSMS(phoneNumber: string, message: string, type: string = 'general'): Promise<void> {
    const { error } = await supabase.functions.invoke('intouch-sms', {
      body: { phoneNumber, message, type }
    });

    if (error) throw error;
  },

  async sendWhatsApp(phoneNumber: string, message: string, type: string = 'general'): Promise<void> {
    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: { phoneNumber, message, type }
    });

    if (error) throw error;
  },

  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): () => void {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};
