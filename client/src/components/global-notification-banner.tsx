import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlobalNotification {
  id: number;
  message: string;
  color: string;
  buttonText: string | null;
  buttonUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500", text: "text-white" },
  green: { bg: "bg-green-500", text: "text-white" },
  yellow: { bg: "bg-yellow-500", text: "text-black" },
  red: { bg: "bg-red-500", text: "text-white" },
  purple: { bg: "bg-purple-500", text: "text-white" },
  orange: { bg: "bg-orange-500", text: "text-white" },
};

export function GlobalNotificationBanner() {
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("dismissed_notifications");
    if (stored) {
      try {
        setDismissedIds(JSON.parse(stored));
      } catch {
        setDismissedIds([]);
      }
    }
  }, []);

  const { data: notifications } = useQuery<GlobalNotification[]>({
    queryKey: ["/api/global-notifications/active"],
  });

  const dismissNotification = (id: number) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    sessionStorage.setItem("dismissed_notifications", JSON.stringify(newDismissed));
  };

  const visibleNotifications = notifications?.filter(
    (notif) => !dismissedIds.includes(notif.id)
  );

  if (!visibleNotifications?.length) {
    return null;
  }

  const getColorClasses = (color: string) => {
    return COLOR_CLASSES[color] || COLOR_CLASSES.blue;
  };

  return (
    <div className="space-y-0">
      {visibleNotifications.map((notif) => {
        const colors = getColorClasses(notif.color);
        return (
          <div
            key={notif.id}
            className={`${colors.bg} ${colors.text} px-4 py-3 flex items-center justify-between gap-4`}
            data-testid={`banner-notification-${notif.id}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <p className="text-sm font-medium flex-1" data-testid={`text-notification-message-${notif.id}`}>
                {notif.message}
              </p>
              {notif.buttonText && notif.buttonUrl && (
                <a
                  href={notif.buttonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                  data-testid={`link-notification-button-${notif.id}`}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                  >
                    {notif.buttonText}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="shrink-0 p-1 rounded-md hover:bg-white/20 transition-colors"
              aria-label="Fermer la notification"
              data-testid={`button-dismiss-notification-${notif.id}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
