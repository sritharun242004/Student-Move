import { Wrench, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Axios from "@/config/axios.config";

interface Activity {
  id: string;
  type: "payment" | "maintenance";
  title: string;
  description: string;
  amount?: number;
  created_at: string;
}

export function RecentActivity() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!session?.access) return;

        const response = await Axios.get("/users/dashboard/stats/", {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        });

        if (response.data.status === "success") {
          setActivities(response.data.data.recent_activities);
        }
      } catch (error) {
        console.error("Error fetching recent activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const formatTime = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest payments and maintenance requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading && (
            <div
              key="loading-indicator"
              className="flex items-center justify-center py-8"
            >
              <div className="animate-pulse text-sm text-muted-foreground">
                Loading recent activity...
              </div>
            </div>
          )}
          {!loading &&
            activities.length > 0 &&
            activities.map((activity, index) => (
              <div key={activity.id || index} className="flex items-start">
                <div
                  className={`mr-3 flex h-9 w-9 items-center justify-center rounded-full ${
                    activity.type === "payment" ? "bg-green-100" : "bg-blue-100"
                  }`}
                >
                  {activity.type === "payment" ? (
                    <DollarSign className="h-5 w-5 text-green-600" />
                  ) : (
                    <Wrench className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(activity.created_at)}
                  </p>
                </div>
                {activity.amount && (
                  <div className="text-sm font-medium text-green-600">
                    ${activity.amount.toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          {!loading && activities.length === 0 && (
            <div
              key="no-activity-indicator"
              className="flex items-center justify-center py-8"
            >
              <div className="text-sm text-muted-foreground">
                No recent activity
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
