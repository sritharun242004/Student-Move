import Axios from "@/config/axios.config";
import { 
  Notification, 
  NotificationListResponse, 
  NotificationResponse, 
  NotificationSummary,
  NotificationPreferences 
} from "@/types/notificationTypes";

class NotificationService {
  private static instance: NotificationService;
  private authToken: string | null = null;
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Set the authorization token for requests
  setAuthToken(token: string) {
    this.authToken = token;
  }

  // Remove the authorization token
  removeAuthToken() {
    this.authToken = null;
  }

  // Get headers with auth token
  private getHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  /**
   * Get paginated list of notifications
   */
  async getNotifications(params?: {
    type?: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.append('type', params.type);
    if (params?.unreadOnly) queryParams.append('unread_only', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());

    const url = `/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await Axios.get(url, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Get single notification by ID
   */
  async getNotification(id: number): Promise<NotificationResponse> {
    const response = await Axios.get(`/notifications/${id}/`, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number): Promise<NotificationResponse> {
    const response = await Axios.post(`/notifications/${id}/mark-as-read/`, {}, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<NotificationResponse> {
    const response = await Axios.post('/notifications/mark-all-as-read/', {}, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await Axios.get('/notifications/unread-count/', { headers: this.getHeaders() });
    return response.data.data;
  }

  /**
   * Get notification summary by type
   */
  async getSummary(): Promise<NotificationSummary> {
    const response = await Axios.get('/notifications/summary/', { headers: this.getHeaders() });
    return response.data.data;
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await Axios.get('/notification-preferences/', { headers: this.getHeaders() });
    return response.data.data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationResponse> {
    const response = await Axios.patch('/notification-preferences/', preferences, { headers: this.getHeaders() });
    return response.data;
  }
}

export default NotificationService.getInstance();
