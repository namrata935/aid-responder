import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Shelter {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  capacity: number;
  current_occupancy: number;
  contact: string;
}

interface Resource {
  resource_id: number;
  shelter_id: number;
  type: string;
  quantity: number;
  needed: number;
  last_updated: string;
}

export default function ResourcesPage() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all shelters
      const { data: sheltersData, error: sheltersError } = await supabase
        .from('shelters')
        .select('*')
        .order('name', { ascending: true });

      if (sheltersError) throw sheltersError;
      setShelters(sheltersData || []);

      // Fetch all resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*');

      if (resourcesError) throw resourcesError;
      setResources(resourcesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedShelterData = shelters.find(s => s.id === selectedShelter);
  const shelterResources = selectedShelter 
    ? resources.filter(r => r.shelter_id === selectedShelter) 
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 hero-gradient rounded-lg">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">FloodRelief</h1>
              <p className="text-xs text-muted-foreground">Resource Status</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Shelter <span className="text-gradient">Resources</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            View the current resource status across all relief shelters.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Shelter Selection */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Select a Shelter</h2>
            
            {shelters.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Shelters Found</h3>
                <p className="text-muted-foreground">No shelters are currently registered in the system.</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {shelters.map((shelter, index) => {
                  const shelterRes = resources.filter(r => r.shelter_id === shelter.id);
                  const totalNeeded = shelterRes.reduce((sum, r) => sum + r.needed, 0);
                  const totalAvailable = shelterRes.reduce((sum, r) => sum + r.quantity, 0);
                  const fulfillment = totalNeeded > 0 ? (totalAvailable / totalNeeded) * 100 : 100;

                  return (
                    <Card
                      key={shelter.id}
                      variant={selectedShelter === shelter.id ? 'elevated' : 'interactive'}
                      className={`cursor-pointer animate-slide-up ${
                        selectedShelter === shelter.id ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setSelectedShelter(shelter.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          {selectedShelter === shelter.id && (
                            <Badge variant="default">Selected</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mt-2">{shelter.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {shelter.city}, {shelter.state}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Occupancy</span>
                            <span className="font-medium">
                              {shelter.current_occupancy}/{shelter.capacity}
                            </span>
                          </div>
                          <Progress 
                            value={(shelter.current_occupancy / shelter.capacity) * 100} 
                            className="h-2" 
                          />
                          
                          {shelterRes.length > 0 && (
                            <>
                              <div className="flex justify-between text-sm mt-3">
                                <span className="text-muted-foreground">Resource fulfillment</span>
                                <span className="font-medium">{Math.round(fulfillment)}%</span>
                              </div>
                              <Progress value={fulfillment} className="h-2" />
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                {shelterRes.filter(r => r.quantity < r.needed).slice(0, 3).map(r => (
                                  <Badge key={r.resource_id} variant="priority_high" className="text-xs capitalize">
                                    {r.type} needed
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resource Display */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resource Status</h2>
            
            {selectedShelter ? (
              <Card variant="elevated" className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-lg">{selectedShelterData?.name}</CardTitle>
                  <CardDescription>
                    {selectedShelterData?.address}, {selectedShelterData?.city}
                  </CardDescription>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-xs">
                      Contact: {selectedShelterData?.contact}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {shelterResources.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No resources tracked for this shelter
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shelterResources.map(resource => {
                        const fulfillmentPercent = resource.needed > 0 
                          ? (resource.quantity / resource.needed) * 100 
                          : 100;
                        const isLow = fulfillmentPercent < 50;
                        const isCritical = fulfillmentPercent < 25;

                        return (
                          <div 
                            key={resource.resource_id} 
                            className="p-4 rounded-lg border bg-card"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                <span className="font-medium capitalize">{resource.type}</span>
                              </div>
                              <Badge 
                                variant={
                                  isCritical ? 'priority_high' : 
                                  isLow ? 'priority_medium' : 
                                  'status_completed'
                                }
                              >
                                {Math.round(fulfillmentPercent)}%
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Available</span>
                                <span className="font-medium">{resource.quantity}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Needed</span>
                                <span className="font-medium">{resource.needed}</span>
                              </div>
                              <Progress 
                                value={fulfillmentPercent} 
                                className="h-2"
                              />
                              <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(resource.last_updated).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Select a shelter to view its resource status
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}