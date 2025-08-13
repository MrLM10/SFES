import React, { useState } from 'react';
import { Edit, Save, X, Plus, Trash2, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { PointsConfig, PointsTier, DEFAULT_POINTS_CONFIG } from '../../utils/database';

interface PointsConfigurationProps {
  pointsConfig: PointsConfig;
  onUpdate: (config: PointsConfig) => Promise<void>;
  isLoading: boolean;
  readOnly?: boolean;
}

export function PointsConfiguration({ pointsConfig, onUpdate, isLoading, readOnly = false }: PointsConfigurationProps) {
  const [editingConfig, setEditingConfig] = useState(false);
  const [config, setConfig] = useState<PointsConfig>(pointsConfig);

  React.useEffect(() => {
    setConfig(pointsConfig);
  }, [pointsConfig]);

  const addPointsTier = () => {
    setConfig(prev => ({
      ...prev,
      tiers: [...prev.tiers, { minAmount: 0, maxAmount: 0, points: 0 }]
    }));
  };

  const updatePointsTier = (index: number, tier: PointsTier) => {
    setConfig(prev => ({
      ...prev,
      tiers: prev.tiers.map((t, i) => i === index ? tier : t)
    }));
  };

  const removePointsTier = (index: number) => {
    setConfig(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    await onUpdate(config);
    setEditingConfig(false);
  };

  const handleCancel = () => {
    setConfig(pointsConfig);
    setEditingConfig(false);
  };

  const canEdit = !readOnly && !isLoading;

  return (
    <div className="space-y-6">
      {readOnly && (
        <Alert className="border-blue-200 bg-blue-50">
          <Eye className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Modo Somente Leitura:</strong> Apenas administradores gerais podem alterar as configurações de pontos. 
            Como administrador de loja, você pode visualizar as regras em vigor.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sistema de Pontos</CardTitle>
              <CardDescription>
                {readOnly ? 'Visualizar regras de pontuação da sua loja' : 'Configure as regras de pontuação para todas as lojas'}
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                onClick={() => setEditingConfig(!editingConfig)}
                variant={editingConfig ? "destructive" : "outline"}
              >
                {editingConfig ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">Moeda</Label>
              <Input
                id="currency"
                value={config.currency}
                onChange={(e) => setConfig(prev => ({ ...prev, currency: e.target.value }))}
                disabled={!editingConfig}
                readOnly={readOnly}
              />
            </div>
            <div>
              <Label htmlFor="discountPercentage">Desconto por Ponto (MZN)</Label>
              <Input
                id="discountPercentage"
                type="number"
                step="0.1"
                value={config.discountPercentage}
                onChange={(e) => setConfig(prev => ({ ...prev, discountPercentage: parseFloat(e.target.value) }))}
                disabled={!editingConfig}
                readOnly={readOnly}
              />
              <p className="text-xs text-gray-500 mt-1">
                1 ponto = {config.discountPercentage} MZN de desconto
              </p>
            </div>
            <div>
              <Label htmlFor="minimumPoints">Mínimo para Resgate</Label>
              <Input
                id="minimumPoints"
                type="number"
                value={config.minimumPointsToRedeem}
                onChange={(e) => setConfig(prev => ({ ...prev, minimumPointsToRedeem: parseInt(e.target.value) }))}
                disabled={!editingConfig}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Tiers Configuration */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Faixas de Pontuação</h4>
              {editingConfig && !readOnly && (
                <Button size="sm" onClick={addPointsTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Faixa
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {config.tiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Valor Mínimo ({config.currency})</Label>
                    <Input
                      type="number"
                      value={tier.minAmount}
                      onChange={(e) => updatePointsTier(index, { ...tier, minAmount: parseInt(e.target.value) })}
                      disabled={!editingConfig}
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Valor Máximo ({config.currency})</Label>
                    <Input
                      type="number"
                      value={tier.maxAmount === Infinity ? '' : tier.maxAmount}
                      onChange={(e) => updatePointsTier(index, { ...tier, maxAmount: e.target.value ? parseInt(e.target.value) : Infinity })}
                      disabled={!editingConfig}
                      readOnly={readOnly}
                      placeholder="Infinito"
                    />
                  </div>
                  <div>
                    <Label>Pontos Ganhos</Label>
                    <Input
                      type="number"
                      value={tier.points}
                      onChange={(e) => updatePointsTier(index, { ...tier, points: parseInt(e.target.value) })}
                      disabled={!editingConfig}
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="flex items-end">
                    {editingConfig && !readOnly ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removePointsTier(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="text-sm text-gray-500 p-2">
                        Faixa {index + 1}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example Calculation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Exemplo de Cálculo</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Compra de 1,500 MZN:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Pontos ganhos: {config.tiers.find(t => 1500 >= t.minAmount && 1500 <= t.maxAmount)?.points || 0} pontos</li>
                <li>• Desconto disponível: {((config.tiers.find(t => 1500 >= t.minAmount && 1500 <= t.maxAmount)?.points || 0) * config.discountPercentage).toFixed(2)} MZN</li>
              </ul>
            </div>
          </div>

          {editingConfig && !readOnly && (
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setConfig(DEFAULT_POINTS_CONFIG);
                }}
                variant="outline"
              >
                Restaurar Padrão
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}