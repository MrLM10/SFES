import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Flashlight, FlashlightOff, Search, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      checkCameraPermission();
    }
    
    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(permission.state);
      
      if (permission.state === 'granted') {
        startScanning();
      }
    } catch (error) {
      console.log('Permission API not supported, trying direct access');
      startScanning();
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Check for flash capability safely
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        // Safely check for torch capability
        setHasFlash(!!(capabilities as any)?.torch);
        
        // Initialize barcode scanner
        initBarcodeScanner();
      }
      
    } catch (error: any) {
      console.error('Camera access error:', error);
      setCameraPermission('denied');
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      setIsScanning(false);
    }
  };

  const initBarcodeScanner = () => {
    // Simple barcode detection using HTML5 video
    const scanInterval = setInterval(() => {
      if (videoRef.current && isScanning) {
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context && videoRef.current.videoWidth && videoRef.current.videoHeight) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          
          // In a real implementation, you would use a barcode detection library here
          // For demo purposes, we'll simulate detection
          simulateBarcodeDetection();
        }
      }
    }, 1000);
    
    scannerRef.current = scanInterval;
  };

  const simulateBarcodeDetection = () => {
    // This is a simulation - in a real app you would use a library like QuaggaJS or ZXing
    // For demo, we'll randomly detect one of our sample barcodes
    const sampleBarcodes = [
      '7896273302123', '7896273302124', '7896273302125', '7896273302126',
      '7896273302127', '7896273302128', '7896273302129', '7896273302130'
    ];
    
    // 10% chance of "detecting" a barcode each scan
    if (Math.random() < 0.1) {
      const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
      handleBarcodeDetected(randomBarcode);
    }
  };

  const handleBarcodeDetected = (barcode: string) => {
    setIsScanning(false);
    stopScanning();
    onScan(barcode);
    onClose();
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scannerRef.current) {
      clearInterval(scannerRef.current);
      scannerRef.current = null;
    }
    
    setIsScanning(false);
    setFlashEnabled(false);
  };

  const toggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      try {
        const track = streamRef.current.getVideoTracks()[0];
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } catch (error) {
        console.error('Error toggling flash:', error);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDetected(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Scanner de Código de Barras
          </DialogTitle>
          <DialogDescription>
            Aponte a câmera para o código de barras do produto ou digite manualmente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {cameraPermission === 'denied' && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertDescription className="text-orange-800">
                <strong>Câmera não autorizada:</strong> Para usar o scanner, permita o acesso à câmera nas configurações do navegador.
              </AlertDescription>
            </Alert>
          )}

          {/* Camera Scanner */}
          {cameraPermission !== 'denied' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Scanner da Câmera</CardTitle>
                  <div className="flex space-x-2">
                    {hasFlash && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleFlash}
                        disabled={!isScanning}
                      >
                        {flashEnabled ? (
                          <FlashlightOff className="h-4 w-4" />
                        ) : (
                          <Flashlight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {!isScanning && cameraPermission === 'granted' && (
                      <Button size="sm" onClick={startScanning}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {isScanning ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      
                      {/* Scanning overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-red-500 rounded-lg" style={{ width: '250px', height: '150px' }}>
                          <div className="w-full h-full border-2 border-white/50 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Scanning animation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-1 bg-red-500 opacity-80 animate-pulse"></div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      {cameraPermission === 'prompt' ? (
                        <div className="text-center">
                          <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Clique para iniciar scanner</p>
                          <Button 
                            className="mt-4 bg-red-600 hover:bg-red-700" 
                            onClick={startScanning}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Iniciar Scanner
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>Scanner parado</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {isScanning && (
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Procurando código de barras...</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Posicione o código de barras dentro do quadrado vermelho
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manual Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Entrada Manual
              </CardTitle>
              <CardDescription>
                Digite o código de barras manualmente se o scanner não funcionar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="manualCode">Código de Barras</Label>
                  <Input
                    id="manualCode"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ex: 7896273302123"
                    pattern="[0-9]+"
                    title="Digite apenas números"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!manualCode.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Produto
                </Button>
              </form>

              {/* Sample codes for testing */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Códigos para teste:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setManualCode('7896273302123')}
                    className="text-blue-600 hover:text-blue-800 text-left"
                  >
                    7896273302123 (Arroz)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualCode('7896273302131')}
                    className="text-blue-600 hover:text-blue-800 text-left"
                  >
                    7896273302131 (Coca-Cola)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualCode('7896273302128')}
                    className="text-blue-600 hover:text-blue-800 text-left"
                  >
                    7896273302128 (Detergente)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualCode('7896273302134')}
                    className="text-blue-600 hover:text-blue-800 text-left"
                  >
                    7896273302134 (Frango)
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}