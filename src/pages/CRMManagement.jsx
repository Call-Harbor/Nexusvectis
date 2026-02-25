import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Phone, TrendingUp, Activity } from "lucide-react";
import CustomerContactsPanel from "../components/crm/CustomerContactsPanel";
import DealsPanel from "../components/crm/DealsPanel";
import ActivityPanel from "../components/crm/ActivityPanel";

export default function CRMManagement() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await base44.entities.Customer.list('-updated_date', 100);
    setCustomers(data || []);
    if (data && data.length > 0) {
      setSelectedCustomer(data[0]);
    }
    setLoading(false);
  };

  const handleNewCustomer = async (e) => {
    e.preventDefault();
    const user = await base44.auth.me();
    const newCust = await base44.entities.Customer.create({
      name: newCustomerName,
      organization_id: user.organization_id,
      status: "active"
    });
    setNewCustomerName("");
    setShowNewCustomer(false);
    loadCustomers();
    setSelectedCustomer(newCust);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      icon: Users,
      label: "Kunder",
      value: customers.length,
      color: "cyan"
    },
    {
      icon: Phone,
      label: "Kontakter",
      value: "?",
      color: "violet"
    },
    {
      icon: TrendingUp,
      label: "Aktive Deals",
      value: "?",
      color: "fuchsia"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CRM System</h1>
          <p className="text-slate-400">Administrer kunder, kontakter, deals og aktiviteter</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="p-6 bg-slate-900 border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 text-${stat.color}-400 opacity-50`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Customers List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900 border-slate-800 h-[600px] flex flex-col">
              <div className="p-4 border-b border-slate-800">
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="Søg kunder..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-800 border-slate-700 pl-8 text-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setShowNewCustomer(!showNewCustomer)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-sm"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ny Kunde
                </Button>
              </div>

              {showNewCustomer && (
                <div className="p-4 border-b border-slate-800">
                  <form onSubmit={handleNewCustomer} className="space-y-2">
                    <Input
                      placeholder="Kundenavn"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-sm"
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-cyan-600 text-xs py-1">Tilføj</Button>
                      <Button
                        type="button"
                        onClick={() => setShowNewCustomer(false)}
                        variant="outline"
                        className="flex-1 text-xs py-1"
                      >
                        Annuller
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                  <p className="text-slate-400 text-sm p-4">Indlæser...</p>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-slate-400 text-sm p-4">Ingen kunder fundet</p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                        selectedCustomer?.id === customer.id
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <p className="font-medium truncate">{customer.name}</p>
                      {customer.email && <p className="text-xs opacity-75 truncate">{customer.email}</p>}
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Customer Details */}
          {selectedCustomer && (
            <div className="lg:col-span-3 space-y-6">
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-4">{selectedCustomer.name}</h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {selectedCustomer.email && (
                    <div>
                      <p className="text-slate-400">Email</p>
                      <p className="text-white">{selectedCustomer.email}</p>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div>
                      <p className="text-slate-400">Telefon</p>
                      <p className="text-white">{selectedCustomer.phone}</p>
                    </div>
                  )}
                  {selectedCustomer.company && (
                    <div>
                      <p className="text-slate-400">Virksomhed</p>
                      <p className="text-white">{selectedCustomer.company}</p>
                    </div>
                  )}
                  {selectedCustomer.status && (
                    <div>
                      <p className="text-slate-400">Status</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedCustomer.status === "active" ? "bg-emerald-600" : "bg-slate-600"
                      } text-white`}>
                        {selectedCustomer.status === "active" ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Tabs defaultValue="contacts" className="space-y-4">
                <TabsList className="bg-slate-800 border-slate-700">
                  <TabsTrigger value="contacts" className="data-[state=active]:bg-cyan-600">
                    <Phone className="w-4 h-4 mr-2" />
                    Kontakter
                  </TabsTrigger>
                  <TabsTrigger value="deals" className="data-[state=active]:bg-cyan-600">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Deals
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="data-[state=active]:bg-cyan-600">
                    <Activity className="w-4 h-4 mr-2" />
                    Aktiviteter
                  </TabsTrigger>
                </TabsList>

                <Card className="p-6 bg-slate-900 border-slate-800">
                  <TabsContent value="contacts" className="mt-0">
                    <CustomerContactsPanel customerId={selectedCustomer.id} />
                  </TabsContent>
                  <TabsContent value="deals" className="mt-0">
                    <DealsPanel customerId={selectedCustomer.id} />
                  </TabsContent>
                  <TabsContent value="activities" className="mt-0">
                    <ActivityPanel customerId={selectedCustomer.id} />
                  </TabsContent>
                </Card>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}