import React, { useState, useEffect } from 'react';
import { 
  Link, 
  Copy, 
  Check, 
  X, 
  Clock, 
  Eye, 
  Plus, 
  RefreshCw,
  UserPlus,
  Users,
  Globe,
  Calendar,
  MapPin,
  Building
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface RegistrationLink {
  id: string;
  code: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
}

interface RegistrationRequest {
  id: string;
  registrationCode: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  province: string;
  city: string;
  position: string;
  location: string;
  storeName: string;
  language: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface AdminRegistrationManagerProps {
  onClose?: () => void;
}

export function AdminRegistrationManager({ onClose }: AdminRegistrationManagerProps) {
  const [registrationLinks, setRegistrationLinks] = useState<RegistrationLink[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [newLinkSettings, setNewLinkSettings] = useState({
    maxUsage: 10,
    expiresInDays: 30
  });

  // Mock data - In real app, fetch from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    // Mock registration links
    const mockLinks: RegistrationLink[] = [
      {
        id: '1',
        code: 'REG-001-ABC123',
        url: 'https://sistema.exemplo.com/registro/REG-001-ABC123',
        createdAt: '2024-01-15T10:30:00Z',
        expiresAt: '2024-02-15T10:30:00Z',
        usageCount: 3,
        maxUsage: 10,
        isActive: true
      },
      {
        id: '2',
        code: 'REG-002-XYZ789',
        url: 'https://sistema.exemplo.com/registro/REG-002-XYZ789',
        createdAt: '2024-01-10T14:20:00Z',
        expiresAt: '2024-02-10T14:20:00Z',
        usageCount: 1,
        maxUsage: 5,
        isActive: true
      }
    ];

    // Mock registration requests
    const mockRequests: RegistrationRequest[] = [
      {
        id: '1',
        registrationCode: 'REG-001-ABC123',
        name: 'João Silva Santos',
        email: 'joao.silva@shoprite.co.mz',
        phone: '+258 84 123 4567',
        countryCode: '+258',
        country: 'Moçambique',
        province: 'Maputo',
        city: 'Maputo',
        position: 'Gerente de Loja',
        location: 'Bairro Central, Shopping Maputo',
        storeName: 'Shoprite Maputo Central',
        language: 'pt',
        status: 'pending_approval',
        createdAt: '2024-01-16T09:15:00Z'
      },
      {
        id: '2',
        registrationCode: 'REG-001-ABC123',
        name: 'Maria Fernanda Costa',
        email: 'maria.costa@shoprite.co.mz',
        phone: '+258 87 987 6543',
        countryCode: '+258',
        country: 'Moçambique',
        province: 'Sofala',
        city: 'Beira',
        position: 'Supervisora',
        location: 'Bairro Manga, Avenida do Zimbabwe',
        storeName: 'Shoprite Beira',
        language: 'pt',
        status: 'approved',
        createdAt: '2024-01-14T16:45:00Z',
        reviewedAt: '2024-01-15T08:30:00Z',
        reviewedBy: 'Admin Geral'
      },
      {
        id: '3',
        registrationCode: 'REG-002-XYZ789',
        name: 'Carlos Manuel Sitoe',
        email: 'carlos.sitoe@shoprite.co.mz',
        phone: '+258 82 555 1234',
        countryCode: '+258',
        country: 'Moçambique',
        province: 'Inhambane',
        city: 'Maxixe',
        position: 'Gerente Geral',
        location: 'Centro da Cidade',
        storeName: 'Shoprite Maxixe',
        language: 'pt',
        status: 'pending_approval',
        createdAt: '2024-01-17T11:20:00Z'
      }
    ];

    setRegistrationLinks(mockLinks);
    setRegistrationRequests(mockRequests);
    setIsLoading(false);
  };

  const generateRegistrationLink = async () => {
    setIsLoading(true);
    
    try {
      // Generate unique code
      const code = `REG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const url = `${window.location.origin}/registro/${code}`;
      
      const newLink: RegistrationLink = {
        id: Date.now().toString(),
        code,
        url,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + newLinkSettings.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
        usageCount: 0,
        maxUsage: newLinkSettings.maxUsage,
        isActive: true
      };
      
      setRegistrationLinks(prev => [newLink, ...prev]);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(newLink.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
      
    } catch (error) {
      console.error('Error generating link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setRegistrationRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? {
              ...request,
              status: 'approved',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin Geral'
            }
          : request
      )
    );
    setSelectedRequest(null);
  };

  const handleRejectRequest = async (requestId: string) => {
    setRegistrationRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? {
              ...request,
              status: 'rejected',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin Geral'
            }
          : request
      )
    );
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-700"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingRequests = registrationRequests.filter(r => r.status === 'pending_approval');
  const processedRequests = registrationRequests.filter(r => r.status !== 'pending_approval');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Cadastros</h2>
          <p className="text-gray-600">Gere links e aprove solicitações de administradores comuns</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      <Tabs defaultValue="links" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="links">Links de Cadastro</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-red-600 text-white text-xs px-1 py-0">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processados</TabsTrigger>
        </TabsList>

        {/* Links de Cadastro */}
        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="h-5 w-5 mr-2" />
                Gerar Novo Link
              </CardTitle>
              <CardDescription>
                Crie um link único para cadastro de administradores comuns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUsage">Máximo de Usos</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={newLinkSettings.maxUsage}
                    onChange={(e) => setNewLinkSettings(prev => ({ ...prev, maxUsage: parseInt(e.target.value) }))}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="expiresInDays">Expira em (dias)</Label>
                  <Input
                    id="expiresInDays"
                    type="number"
                    value={newLinkSettings.expiresInDays}
                    onChange={(e) => setNewLinkSettings(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
                    min="1"
                    max="365"
                  />
                </div>
              </div>
              <Button 
                onClick={generateRegistrationLink} 
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isLoading ? 'Gerando...' : 'Gerar Link de Cadastro'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links Ativos</CardTitle>
              <CardDescription>
                {registrationLinks.length} link(s) de cadastro criado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {registrationLinks.map((link) => (
                  <div key={link.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{link.code}</Badge>
                        <Badge variant="secondary" className={link.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {link.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {link.usageCount}/{link.maxUsage} usos
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-2 mb-2">
                      <code className="text-sm break-all">{link.url}</code>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>Criado: {new Date(link.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span>Expira: {new Date(link.expiresAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(link.url, link.id)}
                      className="w-full"
                    >
                      {copiedLinkId === link.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Link
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Solicitações Pendentes */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                Solicitações Pendentes ({pendingRequests.length})
              </CardTitle>
              <CardDescription>
                Aprove ou rejeite as solicitações de cadastro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma solicitação pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{request.name}</h3>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <Building className="h-3 w-3 mr-1" />
                            {request.storeName}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {request.location}, {request.city}, {request.province}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(request.createdAt).toLocaleDateString('pt-BR')} às {new Date(request.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Solicitação</DialogTitle>
                                <DialogDescription>
                                  Informações completas do candidato a administrador
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Nome Completo</Label>
                                      <p className="font-medium">{selectedRequest.name}</p>
                                    </div>
                                    <div>
                                      <Label>Cargo</Label>
                                      <p className="font-medium">{selectedRequest.position}</p>
                                    </div>
                                    <div>
                                      <Label>E-mail</Label>
                                      <p className="font-medium">{selectedRequest.email}</p>
                                    </div>
                                    <div>
                                      <Label>Telefone</Label>
                                      <p className="font-medium">{selectedRequest.phone}</p>
                                    </div>
                                    <div>
                                      <Label>País</Label>
                                      <p className="font-medium">{selectedRequest.country}</p>
                                    </div>
                                    <div>
                                      <Label>Província</Label>
                                      <p className="font-medium">{selectedRequest.province}</p>
                                    </div>
                                    <div>
                                      <Label>Cidade</Label>
                                      <p className="font-medium">{selectedRequest.city}</p>
                                    </div>
                                    <div>
                                      <Label>Idioma</Label>
                                      <p className="font-medium">{selectedRequest.language === 'pt' ? 'Português' : selectedRequest.language === 'en' ? 'English' : 'Español'}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Nome do Supermercado</Label>
                                    <p className="font-medium">{selectedRequest.storeName}</p>
                                  </div>
                                  
                                  <div>
                                    <Label>Localização Completa</Label>
                                    <p className="font-medium">{selectedRequest.location}</p>
                                  </div>
                                  
                                  <div className="flex space-x-4 pt-4">
                                    <Button 
                                      onClick={() => handleApproveRequest(selectedRequest.id)}
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Aprovar
                                    </Button>
                                    <Button 
                                      onClick={() => handleRejectRequest(selectedRequest.id)}
                                      variant="destructive"
                                      className="flex-1"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Rejeitar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{request.email}</span>
                          <span>{request.phone}</span>
                          <Badge variant="outline">{request.registrationCode}</Badge>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Solicitações Processadas */}
        <TabsContent value="processed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Solicitações</CardTitle>
              <CardDescription>
                {processedRequests.length} solicitação(ões) processada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma solicitação processada ainda</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Revisado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.name}</div>
                            <div className="text-sm text-gray-500">{request.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.storeName}</div>
                            <div className="text-sm text-gray-500">{request.city}, {request.province}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.reviewedAt && (
                            <div>
                              <div>{new Date(request.reviewedAt).toLocaleDateString('pt-BR')}</div>
                              <div className="text-gray-500">{request.reviewedBy}</div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}