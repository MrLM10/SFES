import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Phone, User, Building, Mail, Flag, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

interface AdminRegistrationFormProps {
  registrationCode?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

const translations = {
  pt: {
    title: 'Cadastro de Administrador',
    subtitle: 'Preencha os dados para solicitar acesso ao sistema',
    selectLanguage: 'Selecione o idioma',
    personalInfo: 'Informações Pessoais',
    storeInfo: 'Informações da Loja',
    name: 'Nome Completo',
    email: 'E-mail',
    phone: 'Telefone',
    country: 'País',
    province: 'Província/Estado',
    city: 'Cidade',
    position: 'Cargo',
    location: 'Localização (Bairro/Loja)',
    storeName: 'Nome do Supermercado',
    submit: 'Enviar Solicitação',
    success: 'Solicitação enviada com sucesso! Aguarde a aprovação do Administrador Geral.',
    error: 'Erro ao enviar solicitação. Tente novamente.',
    required: 'Campo obrigatório',
    invalidCode: 'Código de registro inválido ou expirado',
    phoneHint: 'Ex: +258 84 123 4567',
    back: 'Voltar'
  },
  en: {
    title: 'Administrator Registration',
    subtitle: 'Fill in the details to request system access',
    selectLanguage: 'Select Language',
    personalInfo: 'Personal Information',
    storeInfo: 'Store Information',
    name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    country: 'Country',
    province: 'Province/State',
    city: 'City',
    position: 'Position',
    location: 'Location (Neighborhood/Store)',
    storeName: 'Supermarket Name',
    submit: 'Submit Request',
    success: 'Request submitted successfully! Please wait for General Administrator approval.',
    error: 'Error submitting request. Please try again.',
    required: 'Required field',
    invalidCode: 'Invalid or expired registration code',
    phoneHint: 'Ex: +258 84 123 4567',
    back: 'Back'
  },
  es: {
    title: 'Registro de Administrador',
    subtitle: 'Complete los datos para solicitar acceso al sistema',
    selectLanguage: 'Seleccionar Idioma',
    personalInfo: 'Información Personal',
    storeInfo: 'Información de la Tienda',
    name: 'Nombre Completo',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    country: 'País',
    province: 'Provincia/Estado',
    city: 'Ciudad',
    position: 'Cargo',
    location: 'Ubicación (Barrio/Tienda)',
    storeName: 'Nombre del Supermercado',
    submit: 'Enviar Solicitud',
    success: '¡Solicitud enviada con éxito! Espere la aprobación del Administrador General.',
    error: 'Error al enviar solicitud. Inténtelo de nuevo.',
    required: 'Campo obligatorio',
    invalidCode: 'Código de registro inválido o expirado',
    phoneHint: 'Ej: +258 84 123 4567',
    back: 'Volver'
  }
};

const countries = [
  { code: '+258', name: 'Moçambique', flag: '🇲🇿' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' }
];

const positions = [
  'Gerente Geral',
  'Gerente de Loja',
  'Supervisor',
  'Coordenador',
  'Administrador',
  'General Manager',
  'Store Manager',
  'Supervisor',
  'Coordinator',
  'Administrator'
];

export function AdminRegistrationForm({ registrationCode, onSuccess, onBack }: AdminRegistrationFormProps) {
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+258',
    country: 'Moçambique',
    province: '',
    city: '',
    position: '',
    location: '',
    storeName: ''
  });

  const t = translations[language];

  // Detect country from phone number
  useEffect(() => {
    const country = countries.find(c => c.code === formData.countryCode);
    if (country) {
      setDetectedCountry(country.name);
      setFormData(prev => ({ ...prev, country: country.name }));
    }
  }, [formData.countryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate registration code
      if (!registrationCode) {
        throw new Error(t.invalidCode);
      }

      // Simulate API call to submit registration
      const registrationData = {
        ...formData,
        registrationCode,
        language,
        status: 'pending_approval',
        createdAt: new Date().toISOString()
      };

      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Registration submitted:', registrationData);
      
      setMessage({ type: 'success', text: t.success });
      
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t.error 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!language) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full">
              <Globe className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Select Language / Seleccionar Idioma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setLanguage('pt')} 
              variant="outline" 
              className="w-full justify-start"
            >
              🇵🇹 Português
            </Button>
            <Button 
              onClick={() => setLanguage('en')} 
              variant="outline" 
              className="w-full justify-start"
            >
              🇬🇧 English
            </Button>
            <Button 
              onClick={() => setLanguage('es')} 
              variant="outline" 
              className="w-full justify-start"
            >
              🇪🇸 Español
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-600 p-3 rounded-full mr-3">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600">{t.subtitle}</p>
            </div>
          </div>
          
          {registrationCode && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Código: {registrationCode}
            </Badge>
          )}
        </div>

        {/* Language Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Label className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                {t.selectLanguage}
              </Label>
              <Select value={language} onValueChange={(value: 'pt' | 'en' | 'es') => setLanguage(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">🇵🇹 Português</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t.personalInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t.name} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="João Silva"
                />
              </div>

              <div>
                <Label htmlFor="email">{t.email} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="joao@exemplo.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t.country} *</Label>
                  <Select 
                    value={formData.countryCode} 
                    onValueChange={(value) => handleInputChange('countryCode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.flag} {country.code} - {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">{t.phone} *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    placeholder={t.phoneHint}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="position">{t.position} *</Label>
                <Select 
                  value={formData.position} 
                  onValueChange={(value) => handleInputChange('position', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                {t.storeInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">{t.storeName} *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  required
                  placeholder="Shoprite Maputo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">{t.province} *</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    required
                    placeholder="Maputo"
                  />
                </div>

                <div>
                  <Label htmlFor="city">{t.city} *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    placeholder="Maputo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">{t.location} *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                  placeholder="Bairro Central, Avenida Julius Nyerere"
                />
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                {t.back}
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1 bg-red-600 hover:bg-red-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </div>
              ) : (
                t.submit
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}