import { useEffect, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { LogoUpload } from '@/components/management/LogoUpload';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { maskPhone, maskCPFOrCNPJ, maskCEP, unmask } from '@/lib/masks';
import { fetchAddressByCep } from '@/lib/cep-service';

export default function CompanyPage() {
  const { company, loadingCompany, fetchCompany, updateCompany } = useManagement();
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    website: '',
    zip_code: '',
    address: '',
    city: '',
    state: '',
    logo_url: '',
  });

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        zip_code: company.zip_code || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        logo_url: company.logo_url || '',
      });
    }
  }, [company]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateCompany(formData);
    if (success) {
      toast.success('Dados da empresa atualizados!');
    }
    setSaving(false);
  };

  if (loadingCompany) {
    return (
      <ManagementLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <PageHeader
        title="Empresa"
        description="Configure os dados da sua empresa"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CPF / CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: maskCPFOrCNPJ(e.target.value) }))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  maxLength={18}
                />
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
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo & Address */}
          <div className="space-y-6">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <LogoUpload
                  currentUrl={formData.logo_url}
                  onUpload={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                />
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endereço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </ManagementLayout>
  );
}
