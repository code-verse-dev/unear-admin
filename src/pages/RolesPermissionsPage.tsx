import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Users, ShieldCheck, ShieldAlert, Headphones, DollarSign, Search as SearchIcon, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoleCard {
  id: string;
  name: string;
  users: number;
  description: string;
  permissions: string[];
  icon: React.ElementType;
  color: string;
}

interface RoleUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

const defaultRoles: RoleCard[] = [
  { id: "1", name: "Super Admin", users: 3, description: "Full system access", permissions: ["All Access"], icon: ShieldCheck, color: "bg-primary/10 text-primary" },
  { id: "2", name: "Admin", users: 8, description: "Manage core operations", permissions: ["Users", "Vendors", "Vehicles", "Bookings"], icon: Shield, color: "bg-secondary/15 text-secondary" },
  { id: "3", name: "Manager", users: 15, description: "Operational oversight", permissions: ["View Reports", "Approve Vendors", "Support"], icon: Users, color: "bg-accent/15 text-accent" },
  { id: "4", name: "Support Staff", users: 24, description: "Customer service", permissions: ["Customer Support", "View Tickets"], icon: Headphones, color: "bg-primary/8 text-primary" },
  { id: "5", name: "Finance", users: 6, description: "Financial operations", permissions: ["Payments", "Payouts", "Reports"], icon: DollarSign, color: "bg-secondary/15 text-secondary" },
  { id: "6", name: "Auditor", users: 4, description: "Read-only access", permissions: ["View Only", "Logs", "Reports"], icon: SearchIcon, color: "bg-muted text-muted-foreground" },
];

const defaultUsers: RoleUser[] = [
  { id: "1", firstName: "John", lastName: "Doe", email: "john@unear.com", phone: "+1 555-0101", role: "Super Admin" },
  { id: "2", firstName: "Jane", lastName: "Smith", email: "jane@unear.com", phone: "+1 555-0102", role: "Admin" },
  { id: "3", firstName: "Mike", lastName: "Johnson", email: "mike@unear.com", phone: "+1 555-0103", role: "Manager" },
  { id: "4", firstName: "Sarah", lastName: "Williams", email: "sarah@unear.com", phone: "+1 555-0104", role: "Support Staff" },
  { id: "5", firstName: "Tom", lastName: "Brown", email: "tom@unear.com", phone: "+1 555-0105", role: "Finance" },
  { id: "6", firstName: "Lisa", lastName: "Davis", email: "lisa@unear.com", phone: "+1 555-0106", role: "Auditor" },
];

const permissionModules = ["Dashboard", "Users", "Vendors", "Vehicles", "Bookings", "Payments", "Reports", "Support"];
const permissionActions = ["View", "Create", "Edit", "Delete"];

type PermissionMatrix = Record<string, Record<string, boolean>>;

const emptyMatrix = (): PermissionMatrix => {
  const m: PermissionMatrix = {};
  permissionModules.forEach((mod) => {
    m[mod] = {};
    permissionActions.forEach((act) => { m[mod][act] = false; });
  });
  return m;
};

const RolesPermissionsPage = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleCard[]>(defaultRoles);
  const [users, setUsers] = useState<RoleUser[]>(defaultUsers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState<RoleUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<RoleUser | null>(null);
  const [matrix, setMatrix] = useState<PermissionMatrix>(emptyMatrix());

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "", phone: "",
  });

  const resetForm = () => {
    setForm({ firstName: "", lastName: "", email: "", password: "", role: "", phone: "" });
    setMatrix(emptyMatrix());
    setShowPassword(false);
  };

  const openCreate = () => { resetForm(); setEditUser(null); setShowCreateModal(true); };

  const openEdit = (u: RoleUser) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: "", role: u.role, phone: u.phone });
    setMatrix(emptyMatrix());
    setShowCreateModal(true);
  };

  const toggleMatrix = (mod: string, act: string) => {
    setMatrix((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [act]: !prev[mod][act] },
    }));
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.role) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));

    if (editUser) {
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, ...form, firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, role: form.role } : u));
      toast({ title: "User Updated", description: `${form.firstName} ${form.lastName} has been updated.` });
    } else {
      const newUser: RoleUser = {
        id: String(Date.now()),
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone, role: form.role,
      };
      setUsers((prev) => [...prev, newUser]);
      // Increment role user count
      setRoles((prev) => prev.map((r) => r.name === form.role ? { ...r, users: r.users + 1 } : r));
      toast({ title: "Role Created", description: `${form.firstName} ${form.lastName} added as ${form.role}.` });
    }

    setSaving(false);
    setShowCreateModal(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    setRoles((prev) => prev.map((r) => r.name === deleteUser.role ? { ...r, users: Math.max(0, r.users - 1) } : r));
    toast({ title: "User Deleted", description: `${deleteUser.firstName} ${deleteUser.lastName} removed.` });
    setSaving(false);
    setDeleteUser(null);
  };

  const roleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      "Super Admin": "bg-primary text-primary-foreground",
      "Admin": "bg-secondary text-secondary-foreground",
      "Manager": "bg-accent text-accent-foreground",
      "Support Staff": "bg-muted text-foreground border border-border",
      "Finance": "bg-secondary/80 text-secondary-foreground",
      "Auditor": "bg-muted text-foreground border border-border",
    };
    return map[role] || "bg-muted text-muted-foreground";
  };

  return (
    <PageContainer
      title="Manage Roles & Permissions"
      subtitle="Configure roles, permissions, and user assignments"
      actions={
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Create a New Role
        </Button>
      }
    >
      {/* Summary Bar */}
      <div className="flex items-center gap-6 mt-6 mb-2 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span><strong className="text-foreground">{roles.length}</strong> Roles</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span><strong className="text-foreground">{roles.reduce((s, r) => s + r.users, 0)}</strong> Total Users</span>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id} className="group hover:shadow-lg transition-all duration-200 border-border/60 overflow-hidden">
              <CardContent className="p-0">
                {/* Colored top accent bar */}
                <div className="h-1 bg-gradient-to-r from-secondary to-primary/60" />
                <div className="p-5">
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className={`p-2.5 rounded-xl ${role.color} transition-transform group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-[15px]">{role.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{role.users} users assigned</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{role.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium text-foreground/80 border border-border/40"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Roles Table */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">All Roles</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Manage user role assignments</p>
          </div>
        </div>
        <div className="table-container">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <span className="font-medium text-foreground">{u.firstName} {u.lastName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.phone}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeColor(u.role)}`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteUser(u)} className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User Role" : "Create a New Role"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Password {!editUser && "*"}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editUser ? "Leave blank to keep" : "••••••••"}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0100" />
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Permission Matrix</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[140px]">Module</TableHead>
                    {permissionActions.map((a) => (
                      <TableHead key={a} className="text-center w-[80px]">{a}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionModules.map((mod) => (
                    <TableRow key={mod} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{mod}</TableCell>
                      {permissionActions.map((act) => (
                        <TableCell key={act} className="text-center">
                          <Switch
                            checked={matrix[mod][act]}
                            onCheckedChange={() => toggleMatrix(mod, act)}
                            className="mx-auto"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editUser ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteUser?.firstName} {deleteUser?.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default RolesPermissionsPage;
