import { useState, useEffect, useMemo } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { ClientForm } from '@/components/management/ClientForm';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Phone, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from '@/types/management';

export default function ClientsPage() {
  const { clients, fetchClients, addClient, updateClient, deleteClient, loadingClients } = useManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleDelete = async () => {
    if (selectedId) {
      const success = await deleteClient(selectedId);
      if (success) toast.success('Cliente excluído!');
      setDeleteDialogOpen(false);
      setSelectedId(null);
    }
  };

  const handleSave = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingClient) {
      const success = await updateClient(editingClient.id, data);
      if (success) toast.success('Cliente atualizado!');
    } else {
      const result = await addClient(data);
      if (result) toast.success('Cliente adicionado!');
    }
  };

  const openNew = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  return (
    <ManagementLayout>
      <PageHeader
        title="Clientes"
        description="Gerencie seus clientes"
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, documento ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loadingClients ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.document || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {client.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{client.city ? `${client.city}/${client.state}` : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          setSelectedId(client.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editingClient}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManagementLayout>
  );
}
