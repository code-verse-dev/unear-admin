import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Clock } from "lucide-react";

const PushNotificationsPage = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [sendType, setSendType] = useState("now");

  return (
    <PageContainer title="Push Notifications" subtitle="Send notifications to app users">
      <div className="admin-card max-w-2xl">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notification Title</Label>
            <Input
              placeholder="Enter notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Message</Label>
            <Textarea
              placeholder="Enter notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="hosts">Hosts</SelectItem>
                <SelectItem value="renters">Renters</SelectItem>
                <SelectItem value="specific">Specific Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Send Option</Label>
            <div className="flex gap-3">
              <Button
                variant={sendType === "now" ? "default" : "outline"}
                onClick={() => setSendType("now")}
                className={sendType === "now" ? "bg-primary text-primary-foreground" : "border-border"}
              >
                <Send className="w-4 h-4 mr-2" /> Send Now
              </Button>
              <Button
                variant={sendType === "schedule" ? "default" : "outline"}
                onClick={() => setSendType("schedule")}
                className={sendType === "schedule" ? "bg-primary text-primary-foreground" : "border-border"}
              >
                <Clock className="w-4 h-4 mr-2" /> Schedule
              </Button>
            </div>
          </div>

          {sendType === "schedule" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Schedule Date & Time</Label>
              <Input type="datetime-local" className="bg-background border-border" />
            </div>
          )}

          <Button className="bg-primary text-primary-foreground w-full h-11">
            <Send className="w-4 h-4 mr-2" /> Send Notification
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default PushNotificationsPage;
