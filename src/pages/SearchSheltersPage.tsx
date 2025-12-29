import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplets, MapPin, Users, Phone, ArrowLeft } from 'lucide-react';

export default function SearchSheltersPage() {
  const { shelters } = useData();

  const totalCapacity = shelters.reduce((sum, s) => sum + s.totalCapacity, 0);
  const totalOccupancy = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 hero-gradient rounded-lg">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">FloodRelief</h1>
              <p className="text-xs text-muted-foreground">Shelter Finder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">Search Nearby Shelters</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This page is for victims and their families to quickly find available relief shelters.
            For detailed registration and automatic nearest-shelter assignment, you can also create
            an account and continue as a victim later.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {totalOccupancy} people sheltered
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {totalCapacity - totalOccupancy} spots available
            </Badge>
          </div>
        </div>

        <div className="grid gap-4">
          {shelters.map((shelter) => {
            const available = shelter.totalCapacity - shelter.currentOccupancy;
            const isFull = available <= 0;

            return (
              <Card
                key={shelter.id}
                variant="elevated"
                className="animate-slide-up"
              >
                <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {shelter.name}
                      {isFull ? (
                        <Badge variant="destructive" className="text-xs">
                          Full
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-xs">
                          Spots Available
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {shelter.city}, {shelter.state} - {shelter.pincode}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-col items-start sm:items-end gap-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {shelter.currentOccupancy}/{shelter.totalCapacity} people
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {shelter.contactNumber}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">
                        {shelter.address}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Note: Capacity numbers are approximate. Please call the shelter contact
                    number to confirm availability and ask for help with directions or transport
                    if needed.
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {shelters.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No shelters are configured in the system yet. Please contact your local
                authorities for help.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}


