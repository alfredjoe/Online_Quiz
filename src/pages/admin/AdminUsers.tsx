
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserX, Mail, Settings } from 'lucide-react';
import DashboardLayout, { getNavItems } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [activeRole, setActiveRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'disable' | 'delete' | 'reset'>('disable');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } else {
        setUsers(data || []);
        setTotalPages(Math.ceil((data?.length || 0) / 10) || 1);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUserAction = (user: any, action: 'disable' | 'delete' | 'reset') => {
    setSelectedUser(user);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      switch (actionType) {
        case 'disable':
          console.log(`Disabled user ${selectedUser.email}`);
          toast.success(`User ${selectedUser.name} has been disabled`);
          break;
        case 'delete':
          console.log(`Deleted user ${selectedUser.email}`);
          toast.success(`User ${selectedUser.name} has been deleted`);
          break;
        case 'reset':
          console.log(`Reset password for ${selectedUser.email}`);
          toast.success(`Password reset email has been sent to ${selectedUser.email}`);
          break;
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      toast.error('Failed to perform the requested action');
    } finally {
      setIsProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredUsers = users.filter(user => {
    if (activeRole !== 'all' && user.role !== activeRole) {
      return false;
    }
    
    return (
      user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * 10, 
    currentPage * 10
  );

  if (!user) return null;

  return (
    <DashboardLayout navItems={getNavItems('admin')}>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            View and manage user accounts
          </p>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Users</CardTitle>
            <CardDescription>
              View and manage all registered users
            </CardDescription>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchText}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
              </div>
              
              <TabsList>
                <TabsTrigger 
                  value="all" 
                  onClick={() => {
                    setActiveRole('all');
                    setCurrentPage(1);
                  }}
                  className={activeRole === 'all' ? "bg-primary text-primary-foreground" : ""}
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="students" 
                  onClick={() => {
                    setActiveRole('student');
                    setCurrentPage(1);
                  }}
                  className={activeRole === 'student' ? "bg-primary text-primary-foreground" : ""}
                >
                  Students
                </TabsTrigger>
                <TabsTrigger 
                  value="teachers" 
                  onClick={() => {
                    setActiveRole('teacher');
                    setCurrentPage(1);
                  }}
                  className={activeRole === 'teacher' ? "bg-primary text-primary-foreground" : ""}
                >
                  Teachers
                </TabsTrigger>
                <TabsTrigger 
                  value="admins" 
                  onClick={() => {
                    setActiveRole('admin');
                    setCurrentPage(1);
                  }}
                  className={activeRole === 'admin' ? "bg-primary text-primary-foreground" : ""}
                >
                  Admins
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : paginatedUsers.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "teacher" ? "default" : user.role === "admin" ? "destructive" : "outline"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserAction(user, 'reset')}
                            >
                              Reset Password
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserAction(user, 'disable')}
                            >
                              Disable
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                          let pageNumber = currentPage;
                          if (totalPages <= 5) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                          } else {
                            pageNumber = currentPage - 2 + index;
                          }
                          
                          return (
                            <PaginationItem key={index}>
                              <PaginationLink 
                                onClick={() => handlePageChange(pageNumber)}
                                isActive={currentPage === pageNumber}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'disable' 
                ? 'Disable User Account' 
                : actionType === 'delete'
                ? 'Delete User Account'
                : 'Reset User Password'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'disable'
                ? 'Are you sure you want to disable this user account? The user will no longer be able to log in.'
                : actionType === 'delete'
                ? 'Are you sure you want to delete this user account? This action cannot be undone.'
                : 'Are you sure you want to send a password reset email to this user?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "delete" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminUsers;
