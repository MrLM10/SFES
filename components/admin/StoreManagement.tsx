import React from 'react';
import { Edit, MapPin, Building, Phone, Calendar, Users, Plus, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Store } from '../../utils/database';
import { formatDate } from './utils/adminUtils';

interface StoreManagementProps {
  stores: Store[];
  onCreateStore?: () => void;
  onEditStore: (store: Store) => void;
  isGlobalAdmin: boolean;
}

export function StoreManagement({ stores, onCreateStore, onEditStore, isGlobalAdmin }: StoreManagementProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciamento de Lojas</h3>
          <p className="text-gray-600">
            {isGlobalAdmin 
              ? 'Configure e monitore todas as lojas da rede' 
              : 'Visualize e edite os dados da sua loja'}
          </p>
        </div>
        {onCreateStore && isGlobalAdmin && (
          <Button onClick={onCreateStore} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Loja
          </Button>
        )}
      </div>

      {!isGlobalAdmin && (
        <Alert className="border-blue-200 bg-blue-50">
          <Eye className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Administrador de Loja:</strong> Você pode visualizar e editar apenas os dados da sua loja. 
            Para criar novas lojas, entre em contato com o administrador geral.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <Card key={store.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{store.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEditStore(store)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Badge variant={store.isActive ? "secondary" : "destructive"} className={store.isActive ? "bg-green-100 text-green-700" : ""}>
                    {store.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {store.city}, {store.province}, {store.country}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Building className="h-4 w-4 mr-2" />
                {store.address}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {store.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Criada em {formatDate(store.createdAt)}
              </div>
              {store.adminId && (
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  Admin: {store.adminId}
                </div>
              )}
              
              {/* Points Configuration Summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Configuração de Pontos</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Moeda: {store.pointsConfig.currency}</div>
                  <div>Desconto: {store.pointsConfig.discountPercentage} MZN por ponto</div>
                  <div>Mín. resgate: {store.pointsConfig.minimumPointsToRedeem} pontos</div>
                  <div>Faixas: {store.pointsConfig.tiers.length} configuradas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {stores.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isGlobalAdmin ? 'Nenhuma loja cadastrada' : 'Nenhuma loja atribuída'}
            </h3>
            <p className="text-gray-500 mb-4">
              {isGlobalAdmin 
                ? 'Comece criando sua primeira loja no sistema.' 
                : 'Entre em contato com o administrador geral para ter uma loja atribuída.'}
            </p>
            {onCreateStore && isGlobalAdmin && (
              <Button onClick={onCreateStore} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Loja
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}