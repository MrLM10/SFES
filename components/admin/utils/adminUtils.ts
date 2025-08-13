import { Clock, CheckCircle, X } from 'lucide-react';
import { Badge } from '../../ui/badge';
import React from 'react';

export const getStatusBadge = (status: string): React.ReactElement => {
  switch (status) {
    case 'pending':
      return React.createElement(Badge, {
        variant: "secondary",
        className: "bg-yellow-100 text-yellow-700"
      }, [
        React.createElement(Clock, { key: "icon", className: "h-3 w-3 mr-1" }),
        "Pendente"
      ]);
    case 'approved':
      return React.createElement(Badge, {
        variant: "secondary",
        className: "bg-green-100 text-green-700"
      }, [
        React.createElement(CheckCircle, { key: "icon", className: "h-3 w-3 mr-1" }),
        "Aprovado"
      ]);
    case 'completed':
      return React.createElement(Badge, {
        variant: "secondary",
        className: "bg-blue-100 text-blue-700"
      }, [
        React.createElement(CheckCircle, { key: "icon", className: "h-3 w-3 mr-1" }),
        "Concluído"
      ]);
    default:
      return React.createElement(Badge, {
        variant: "secondary"
      }, status);
  }
};

export const validateStoreForm = (form: any): string | null => {
  if (!form.name.trim()) return 'Nome da loja é obrigatório';
  if (!form.province.trim()) return 'Província é obrigatória';
  if (!form.city.trim()) return 'Cidade é obrigatória';
  if (!form.address.trim()) return 'Endereço é obrigatório';
  if (!form.phone.trim()) return 'Telefone é obrigatório';
  return null;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};