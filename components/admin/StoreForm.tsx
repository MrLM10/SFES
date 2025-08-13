import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Store, DEFAULT_POINTS_CONFIG } from '../../utils/database';
import { validateStoreForm } from './utils/adminUtils';

interface StoreFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (store: Store) => Promise<void>;
  editingStore?: Store | null;
  isLoading: boolean;
}

interface StoreFormData {
  name: string;
  country: string;
  province: string;
  city: string;
  address: string;
  phone: string;
  adminId: string;
}

export function StoreForm({ isOpen, onClose, onSubmit, editingStore, isLoading }: StoreFormProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    name: editingStore?.name || '',
    country: editingStore?.country || 'Moçambique',
    province: editingStore?.province || '',
    city: editingStore?.city || '',
    address: editingStore?.address || '',
    phone: editingStore?.phone || '',
    adminId: editingStore?.adminId || ''
  });

  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (editingStore) {
      setFormData({
        name: editingStore.name,
        country: editingStore.country,
        province: editingStore.province,
        city: editingStore.city,
        address: editingStore.address,
        phone: editingStore.phone,
        adminId: editingStore.adminId || ''
      });
    } else {
      setFormData({
        name: '',
        country: 'Moçambique',
        province: '',
        city: '',
        address: '',
        phone: '',
        adminId: ''
      });
    }
    setError('');
  }, [editingStore, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateStoreForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const storeData: Store = {
        id: editingStore?.id || `store-${Date.now()}`,
        name: formData.name,
        country: formData.country,
        province: formData.province,
        city: formData.city,
        address: formData.address,
        phone: formData.phone,
        isActive: editingStore?.isActive ?? true,
        pointsConfig: editingStore?.pointsConfig || DEFAULT_POINTS_CONFIG,
        createdAt: editingStore?.createdAt || new Date().toISOString(),
        adminId: formData.adminId || undefined
      };

      await onSubmit(storeData);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar loja');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingStore ? 'Editar Loja' : 'Nova Loja'}</DialogTitle>
          <DialogDescription>
            {editingStore ? 'Atualize os dados da loja' : 'Cadastre uma nova loja na rede'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeName">Nome da Loja</Label>
              <Input
                id="storeName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Shoprite Maputo Central"
              />
            </div>

            <div>
              <Label htmlFor="storeCountry">País</Label>
              <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Moçambique">Moçambique</SelectItem>
                  <SelectItem value="África do Sul">África do Sul</SelectItem>
                  <SelectItem value="Brasil">Brasil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="storeProvince">Província/Estado</Label>
              <Input
                id="storeProvince"
                value={formData.province}
                onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                required
                placeholder="Maputo"
              />
            </div>

            <div>
              <Label htmlFor="storeCity">Cidade</Label>
              <Input
                id="storeCity"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                required
                placeholder="Maputo"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="storeAddress">Endereço Completo</Label>
            <Textarea
              id="storeAddress"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
              placeholder="Av. Julius Nyerere, 123, Bairro Central"
            />
          </div>

          <div>
            <Label htmlFor="storePhone">Telefone</Label>
            <Input
              id="storePhone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
              placeholder="+258 21 123 456"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? 'Salvando...' : editingStore ? 'Atualizar' : 'Criar Loja'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}