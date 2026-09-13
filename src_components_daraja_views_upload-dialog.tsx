// DARAJA — Upload Dialog (Scanner caméra + PDF + drag-drop)
'use client';

import { useRef, useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Camera, Upload, FileText, Loader2, CheckCircle2, Brain,
  X, AlertCircle,
} from "lucide-react";
import { api } from "@/lib/client";
import { toast } from "sonner";

export function UploadDialog({
  open, onClose, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e: any) {
      toast.error("Caméra indisponible. Utilisez l'upload de fichier à la place.");
      setCameraOn(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    stopCamera();
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `Scan_${Date.now()}.jpg`, { type: "image/jpeg" });
        uploadFile(file);
      }
    }, "image/jpeg", 0.85);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setResult(null);
    setProgress(0);

    // Simule la progression (puisque fetch ne donne pas d'événements upload natifs)
    const interval = setInterval(() => {
      setProgress((p) => Math.min(95, p + Math.random() * 15));
    }, 180);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await api<{ ok: boolean; document: any; classification: any }>(
        "/api/documents",
        { method: "POST", body: fd },
      );
      setProgress(100);
      setResult(data);
      toast.success("Document archivé et classifié par DARAJA Brain.");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message ?? "Échec de l'upload.");
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  const reset = () => {
    setProgress(0);
    setResult(null);
    setUploading(false);
    stopCamera();
  };

  const handleClose = () => {
    stopCamera();
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Upload className="w-5 h-5" /> Archiver un document
          </DialogTitle>
          <DialogDescription>
            Scannez avec la caméra ou uploadez un fichier. DARAJA Brain le classe automatiquement.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Résultat
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-success" />
              <div>
                <div className="font-semibold text-foreground">Document archivé !</div>
                <div className="text-xs text-foreground/60">{result.document.title}</div>
              </div>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Brain className="w-4 h-4" /> Classification DARAJA Brain
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Catégorie</span>
                  <span className="font-medium text-foreground text-right">{result.classification.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Langue détectée</span>
                  <span className="font-medium text-foreground">{result.classification.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Confiance</span>
                  <span className="font-medium text-success">{Math.round(result.classification.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-foreground/60 shrink-0">Tags</span>
                  <span className="text-right">{result.classification.tags.map((t: string) => (
                    <span key={t} className="inline-block text-[10px] bg-accent/40 border border-gold/20 px-1.5 py-0.5 rounded mr-1 mb-1">{t}</span>
                  ))}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Archiver un autre
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleClose}>
                Terminer
              </Button>
            </div>
          </div>
        ) : uploading ? (
          // En cours
          <div className="py-6 space-y-4 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <div>
              <div className="font-medium text-foreground">Archivage en cours…</div>
              <div className="text-xs text-foreground/60 mt-1">Upload + classification IA</div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-foreground/50">{Math.round(progress)}%</div>
          </div>
        ) : (
          // Tabs
          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="scan"><Camera className="w-3.5 h-3.5 mr-1.5" /> Scanner</TabsTrigger>
              <TabsTrigger value="file"><FileText className="w-3.5 h-3.5 mr-1.5" /> Fichier</TabsTrigger>
            </TabsList>

            {/* SCAN */}
            <TabsContent value="scan" className="space-y-3 mt-3">
              {!cameraOn ? (
                <div className="text-center py-6">
                  <Camera className="w-10 h-10 text-primary/50 mx-auto mb-2" />
                  <div className="text-sm text-foreground/70 mb-4">
                    Utilisez la caméra pour scanner un document papier.
                  </div>
                  <Button onClick={startCamera} className="bg-primary hover:bg-primary/90">
                    <Camera className="w-4 h-4 mr-1.5" /> Activer la caméra
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Cadre de scan */}
                    <div className="absolute inset-6 border-2 border-gold rounded-lg pointer-events-none" />
                    <button
                      onClick={stopCamera}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Button onClick={capturePhoto} className="w-full bg-primary hover:bg-primary/90">
                    <Camera className="w-4 h-4 mr-1.5" /> Capturer le document
                  </Button>
                </div>
              )}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </TabsContent>

            {/* FILE */}
            <TabsContent value="file" className="mt-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Upload className="w-10 h-10 text-primary/50 mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground">
                  Cliquez ou glissez un fichier ici
                </div>
                <div className="text-xs text-foreground/50 mt-1">
                  PDF, JPG, PNG — max 25 Mo
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mt-3 flex items-start gap-2 text-xs text-foreground/60 bg-muted/40 p-3 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  Une fois uploadé, le document est chiffré AES-256, classifié par l'IA DARAJA Brain, puis rendu immédiatement accessible via la recherche.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
