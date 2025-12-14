import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/types/management';
import { maskPhone, maskCPFOrCNPJ, maskCEP, unmask, validateCPFOrCNPJ } from '@/lib/masks';
import { fetchAddressByCep } from '@/lib/cep-service';
import { Loader2 } from 'lucide-react';

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function ClientForm({ open, onOpenChange, client, onSave }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        document: client.document || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zip_code: client.zip_code || '',
        notes: client.notes || '',
      });
    } else {
      setFormData({
        name: '',
        document: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        notes: '',
      });
    }
  }, [client, open]);

  const handleCepBlur = async () => {
    const cep = unmask(formData.zip_code);
    if (cep.length === 8) {
      setLoadingCep(true);
      const address = await fetchAddressByCep(cep);
      if (address) {
        setFormData(prev => ({
          ...prev,
          address: address.logradouro,
          city: address.localidade,
          state: address.uf,
        }));
      }
      setLoadingCep(false);
    }
  };

  const handleDocumentChange = (value: string) => {
    const masked = maskCPFOrCNPJ(value);
    setFormData(prev => ({ ...prev, document: masked }));
    
    const cleaned = unmask(masked);
    if (cleaned.length === 11 || cleaned.length === 14) {
      const result = validateCPFOrCNPJ(cleaned);
      if (!result.valid) {
        setDocumentError(`${result.type?.toUpperCase() || 'Documento'} inválido`);
      } else {
        setDocumentError('');
      }
    } else {
      setDocumentError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => handleDocumentChange(e.target.value)}
                maxLength={18}
              />
              {documentError && (
                <p className="text-xs text-destructive">{documentError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <div className="relative">
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_code: maskCEP(e.target.value) }))}
                  onBlur={handleCepBlur}
                />
                {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                maxLength={2}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {client ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
