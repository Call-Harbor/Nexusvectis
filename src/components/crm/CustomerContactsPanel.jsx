import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Mail, Phone, User, Edit, Trash2 } from "lucide-react";

export default function CustomerContactsPanel({ customerId }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    department: ""
  });

  useEffect(() => {
    loadContacts();
  }, [customerId]);

  const loadContacts = async () => {
    if (!customerId) return;
    setLoading(true);
    const data = await base44.entities.Contact.filter({
      customer_id: customerId
    });
    setContacts(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await base44.entities.Contact.create({
      ...formData,
      customer_id: customerId,
      organization_id: await base44.auth.me().then(u => u.organization_id)
    });
    setFormData({ first_name: "", last_name: "", email: "", phone: "", job_title: "", department: "" });
    setShowForm(false);
    loadContacts();
  };

  const handleDelete = async (id) => {
    await base44.entities.Contact.delete(id);
    loadContacts();
  };

  if (loading) return <div className="text-slate-400">Indlæser kontakter...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Kontakter ({contacts.length})</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tilføj
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 bg-slate-800 border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Fornavn"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="bg-slate-900 border-slate-700"
                required
              />
              <Input
                placeholder="Efternavn"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="bg-slate-900 border-slate-700"
                required
              />
            </div>
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-slate-900 border-slate-700"
              required
            />
            <Input
              placeholder="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="bg-slate-900 border-slate-700"
            />
            <Input
              placeholder="Stilling"
              value={formData.job_title}
              onChange={(e) => setFormData({...formData, job_title: e.target.value})}
              className="bg-slate-900 border-slate-700"
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-cyan-600">Gemme</Button>
              <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="flex-1">Annuller</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {contacts.map((contact) => (
          <Card key={contact.id} className="p-4 bg-slate-800 border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-semibold text-white">{contact.first_name} {contact.last_name}</h4>
                </div>
                {contact.job_title && <p className="text-sm text-slate-400">{contact.job_title}</p>}
                <div className="flex flex-wrap gap-3 mt-2">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </a>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleDelete(contact.id)}
                size="icon"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}