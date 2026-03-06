import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface FeeField {
  label: string;
  key: string;
  suffix: string;
  defaultValue: string;
}

const feeFields: FeeField[] = [
  { label: "Marketplace Fee", key: "marketplace", suffix: "%", defaultValue: "10" },
  { label: "Administration Fee", key: "admin", suffix: "%", defaultValue: "5" },
  { label: "Platform Fee", key: "platform", suffix: "%", defaultValue: "3" },
  { label: "Under 25 Driver Fee", key: "under25", suffix: "$", defaultValue: "15" },
  { label: "Trip Fee", key: "trip", suffix: "$", defaultValue: "5" },
];

const SettingsPage = () => {
  const [fees, setFees] = useState<Record<string, string>>(
    Object.fromEntries(feeFields.map((f) => [f.key, f.defaultValue]))
  );
  const [feeLabel, setFeeLabel] = useState("Unear Application Fee");

  const updateFee = (key: string, value: string) => {
    setFees((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PageContainer title="Settings" subtitle="Platform fee configuration">
      <div className="admin-card max-w-2xl">
        <h3 className="text-base font-semibold text-card-foreground mb-5">Platform Fees</h3>
        <div className="space-y-4">
          {feeFields.map((field) => (
            <div key={field.key} className="flex items-center gap-4">
              <Label className="text-sm font-medium w-48 flex-shrink-0">{field.label}</Label>
              <div className="relative flex-1 max-w-[200px]">
                <Input
                  type="number"
                  value={fees[field.key]}
                  onChange={(e) => updateFee(field.key, e.target.value)}
                  className="bg-background border-border pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {field.suffix}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <Label className="text-sm font-medium w-48 flex-shrink-0">Platform Fee Label</Label>
            <Input
              value={feeLabel}
              onChange={(e) => setFeeLabel(e.target.value)}
              className="bg-background border-border flex-1 max-w-[300px]"
            />
          </div>

          <div className="pt-4">
            <Button className="bg-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;
