import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext.supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  Heart, 
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Resource } from '@/types';

export default function DonatePage() {
  const { shelters, resources, addDonation } = useData();
  const [selectedShelter, setSelectedShelter] = useState<string | null>(null);
  const [donationSuccess, setDonationSuccess] = useState(false);
  
  const [donationForm, setDonationForm] = useState({
    resourceType: '' as Resource['type'] | '',
    quantity: '',
    donorName: '',
    donorContact: '',
  });

  const selectedShelterData = shelters.find(s => s.id === selectedShelter);
  const shelterResources = selectedShelter ? resources.filter(r => r.shelterId === selectedShelter) : [];

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShelter || !donationForm.resourceType) {
      toast.error('Please select a shelter and resource type');
      return;
    }

    addDonation({
      shelterId: selectedShelter,
      resourceType: donationForm.resourceType,
      quantity: parseInt(donationForm.quantity),
      donorName: donationForm.donorName || undefined,
      donorContact: donationForm.donorContact || undefined,
    });

    setDonationSuccess(true);
    toast.success('Thank you for your donation!');
  };

  if (donationSuccess) {
    return (
      <div className="min-h-screen bg-background">
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
                <p className="text-xs text-muted-foreground">Donation Portal</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-20 max-w-lg text-center">
          <div className="animate-scale-in">
            <div className="p-6 bg-success/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your donation has been recorded and will help those in need.
              The shelter has been notified of your generous contribution.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => {
                setDonationSuccess(false);
                setSelectedShelter(null);
                setDonationForm({ resourceType: '', quantity: '', donorName: '', donorContact: '' });
              }}>
                <Heart className="w-4 h-4 mr-2" />
                Donate Again
              </Button>
              <Link to="/">
                <Button variant="outline">
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        </main>
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
              <p className="text-xs text-muted-foreground">Donation Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-destructive/10 rounded-full mb-4">
            <Heart className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Make a <span className="text-gradient">Difference</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your donations directly help flood victims. Choose a shelter and contribute 
            the resources they need most.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Shelter Selection */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Select a Shelter to Support</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {shelters.map((shelter, index) => {
                const shelterRes = resources.filter(r => r.shelterId === shelter.id);
                const totalNeeded = shelterRes.reduce((sum, r) => sum + r.quantityNeeded, 0);
                const totalAvailable = shelterRes.reduce((sum, r) => sum + r.quantityAvailable, 0);
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
                          <span className="text-muted-foreground">Resource fulfillment</span>
                          <span className="font-medium">{Math.round(fulfillment)}%</span>
                        </div>
                        <Progress value={fulfillment} className="h-2" />
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {shelterRes.filter(r => r.quantityAvailable < r.quantityNeeded).slice(0, 3).map(r => (
                            <Badge key={r.id} variant="priority_high" className="text-xs capitalize">
                              {r.type} needed
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Donation Form */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Donation</h2>
            
            {selectedShelter ? (
              <Card variant="elevated" className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-lg">{selectedShelterData?.name}</CardTitle>
                  <CardDescription>Select resources to donate</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDonate} className="space-y-4">
                    {/* Resource Needs */}
                    <div className="space-y-2">
                      <Label>Resource Type *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {shelterResources.map(resource => (
                          <button
                            key={resource.id}
                            type="button"
                            onClick={() => setDonationForm(prev => ({ ...prev, resourceType: resource.type }))}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              donationForm.resourceType === resource.type
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              <span className="capitalize font-medium text-sm">{resource.type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Need: {resource.quantityNeeded - resource.quantityAvailable} {resource.unit}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="Enter quantity"
                        value={donationForm.quantity}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name (Optional)</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={donationForm.donorName}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact (Optional)</Label>
                      <Input
                        id="contact"
                        placeholder="Phone or email"
                        value={donationForm.donorContact}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, donorContact: e.target.value }))}
                      />
                    </div>

                    <Button type="submit" variant="hero" className="w-full" size="lg">
                      <Heart className="w-4 h-4 mr-2" />
                      Donate Now
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Select a shelter to view their resource needs and make a donation.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
