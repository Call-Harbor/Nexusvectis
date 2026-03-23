import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, Users, Zap } from 'lucide-react';

export default function DRTMonitor() {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [formData, setFormData] = useState({
    passengers: 1,
    pickupLat: '',
    pickupLng: '',
    dropoffLat: '',
    dropoffLng: ''
  });

  const { data: requests, refetch } = useQuery({
    queryKey: ['drt-requests'],
    queryFn: async () => {
      return await base44.entities.DemandRequest.filter({
        status: { $in: ['pending', 'assigned', 'in_transit'] }
      }, '-requested_time', 20);
    }
  });

  const { data: assignments } = useQuery({
    queryKey: ['drt-assignments'],
    queryFn: async () => {
      return await base44.entities.DRTAssignment.filter({
        status: { $in: ['planning', 'active'] }
      }, '-created_date', 10);
    }
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const newReq = await base44.entities.DemandRequest.create({
        organization_id: 'default',
        request_id: 'drt_' + Date.now(),
        passenger_count: parseInt(formData.passengers),
        pickup_location: {
          latitude: parseFloat(formData.pickupLat),
          longitude: parseFloat(formData.pickupLng),
          address: 'User location'
        },
        dropoff_location: {
          latitude: parseFloat(formData.dropoffLat),
          longitude: parseFloat(formData.dropoffLng),
          address: 'User destination'
        },
        requested_time: new Date().toISOString(),
        status: 'pending'
      });

      // Dispatch matching
      await base44.functions.invoke('drtDispatcher', { organizationId: 'default' });
      return newReq;
    },
    onSuccess: () => {
      setShowNewRequest(false);
      setFormData({ passengers: 1, pickupLat: '', pickupLng: '', dropoffLat: '', dropoffLng: '' });
      refetch();
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demand-Responsive Transit (DRT)</CardTitle>
          <CardDescription>On-demand minibus dispatch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-slate-600 font-semibold mb-1">Pending Requests</div>
              <div className="text-2xl font-bold text-blue-600">{requests?.filter(r => r.status === 'pending').length || 0}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-slate-600 font-semibold mb-1">Active Assignments</div>
              <div className="text-2xl font-bold text-green-600">{assignments?.filter(a => a.status === 'active').length || 0}</div>
            </div>
          </div>

          <Button 
            onClick={() => setShowNewRequest(!showNewRequest)}
            className="w-full"
          >
            {showNewRequest ? 'Cancel' : 'New Request'}
          </Button>

          {showNewRequest && (
            <div className="p-3 border border-slate-200 rounded-lg space-y-3">
              <Input 
                type="number" 
                placeholder="Passengers" 
                min="1"
                value={formData.passengers}
                onChange={(e) => setFormData({...formData, passengers: e.target.value})}
              />
              <div className="text-xs font-semibold text-slate-600">Pickup</div>
              <Input 
                type="number" 
                placeholder="Latitude" 
                step="0.0001"
                value={formData.pickupLat}
                onChange={(e) => setFormData({...formData, pickupLat: e.target.value})}
              />
              <Input 
                type="number" 
                placeholder="Longitude" 
                step="0.0001"
                value={formData.pickupLng}
                onChange={(e) => setFormData({...formData, pickupLng: e.target.value})}
              />
              <div className="text-xs font-semibold text-slate-600">Dropoff</div>
              <Input 
                type="number" 
                placeholder="Latitude" 
                step="0.0001"
                value={formData.dropoffLat}
                onChange={(e) => setFormData({...formData, dropoffLat: e.target.value})}
              />
              <Input 
                type="number" 
                placeholder="Longitude" 
                step="0.0001"
                value={formData.dropoffLng}
                onChange={(e) => setFormData({...formData, dropoffLng: e.target.value})}
              />
              <Button 
                onClick={() => createRequestMutation.mutate()}
                disabled={createRequestMutation.isPending}
                className="w-full"
              >
                {createRequestMutation.isPending ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          )}

          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-600 mb-2">Recent Assignments</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {assignments?.slice(0, 5).map(a => (
                <div key={a.id} className="p-2 bg-slate-50 rounded text-xs">
                  <div className="font-medium">Vehicle {a.drt_vehicle_id}</div>
                  <div className="text-slate-600">{a.requests_count} request(s) • {a.total_passengers} passengers</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}