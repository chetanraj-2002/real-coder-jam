import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignedIn, useUser } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Code2, 
  Plus, 
  Clock, 
  Users, 
  ArrowLeft,
  Trash2,
  ExternalLink
} from "lucide-react";

interface Room {
  id: string;
  language: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  owner_id: string;
  owner_email: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    loadRooms();
  }, [user, navigate]);

  const loadRooms = async () => {
    try {
      const { data: roomsData, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRooms(roomsData || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const createNewRoom = async () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const { error } = await supabase
        .from('rooms')
        .insert([{
          id: roomId,
          owner_id: user?.id,
          owner_email: user?.primaryEmailAddress?.emailAddress,
          language: 'javascript',
          code_content: `// Welcome to LineCraft - Room ${roomId}
// Start coding together!

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`
        }]);

      if (error) throw error;
      
      toast.success(`Room ${roomId} created successfully!`);
      navigate(`/editor/${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .eq('owner_id', user?.id);

      if (error) throw error;
      
      toast.success('Room deleted successfully');
      loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SignedIn>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border px-6 py-4">
          <div className="container max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  <Code2 className="h-6 w-6 text-primary" />
                  <div>
                    <h1 className="text-lg font-semibold">LineCraft Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Manage your coding rooms</p>
                  </div>
                </div>
              </div>
              <Button onClick={createNewRoom} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Room
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-6xl mx-auto px-6 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Loading your rooms...</div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No rooms yet</h3>
              <p className="text-muted-foreground mb-6">Create your first coding room to get started</p>
              <Button onClick={createNewRoom} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Room
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Rooms ({rooms.length})</h2>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room) => (
                  <Card key={room.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-mono">{room.id}</CardTitle>
                        <Badge variant={room.is_active ? "default" : "secondary"}>
                          {room.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Code2 className="h-4 w-4" />
                        <span className="capitalize">{room.language}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated {formatDate(room.updated_at)}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          asChild 
                          size="sm" 
                          className="flex-1 gap-2"
                        >
                          <Link to={`/editor/${room.id}`}>
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteRoom(room.id)}
                          className="gap-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </SignedIn>
  );
};

export default Dashboard;