import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Plus, X, User, Baby } from 'lucide-react';

const BRAND_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69693b3d8c5d3c2fd0c67ca4/bdaa51aa4_ChatGPTImage15_01_202616_47_55.png";

const steps = [
  { id: 'welcome', title: 'Bem-vindo' },
  { id: 'about', title: 'Sobre você' },
  { id: 'preferences', title: 'Preferências' },
  { id: 'children', title: 'Seus filhos' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    age: '',
    sexual_orientation: '',
    religious_orientation: '',
    political_orientation: '',
    marital_status: ''
  });
  const [children, setChildren] = useState([]);
  const [newChild, setNewChild] = useState({ name: '', age: '', gender: '', favorite_hobby: '', favorite_color: '', favorite_food: '', favorite_movie_genre: '' });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addChild = () => {
    if (newChild.name && newChild.age && newChild.gender) {
      setChildren([...children, { ...newChild, age: parseInt(newChild.age) }]);
      setNewChild({ name: '', age: '', gender: '', favorite_hobby: '', favorite_color: '', favorite_food: '', favorite_movie_genre: '' });
    }
  };

  const removeChild = (index) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        ...userData,
        age: parseInt(userData.age),
        onboarding_completed: true
      });

      for (const child of children) {
        await base44.entities.Child.create(child);
      }

      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <img src={BRAND_LOGO} alt="Entre Nós" className="w-28 h-28 mx-auto mb-8 rounded-3xl" />
            <h1 className="text-3xl font-light text-white mb-4">
              Entre Nós
            </h1>
            <p className="text-zinc-400 text-lg mb-2">
              Bem-vindo à jornada de ser um pai presente e consciente.
            </p>
            <p className="text-zinc-500 text-sm">
              Vamos personalizar sua experiência para ajudá-lo na missão de educar seus filhos com propósito.
            </p>
          </motion.div>
        );

      case 'about':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <User className="w-8 h-8 text-zinc-400" />
              </div>
              <h2 className="text-2xl font-light text-white">Sobre você</h2>
              <p className="text-zinc-500 mt-2 text-sm">Conte-nos um pouco sobre você</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="age" className="text-zinc-400">Sua idade</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Ex: 35"
                  value={userData.age}
                  onChange={(e) => setUserData({ ...userData, age: e.target.value })}
                  className="mt-1.5 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>
            </div>
          </motion.div>
        );

      case 'preferences':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light text-white">Suas preferências</h2>
              <p className="text-zinc-500 mt-2 text-sm">Isso nos ajuda a personalizar os insights</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400">Orientação Sexual</Label>
                <Select
                  value={userData.sexual_orientation}
                  onValueChange={(v) => setUserData({ ...userData, sexual_orientation: v })}
                >
                  <SelectTrigger className="mt-1.5 h-12 bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="heterossexual">Heterossexual</SelectItem>
                    <SelectItem value="homossexual">Homossexual</SelectItem>
                    <SelectItem value="bissexual">Bissexual</SelectItem>
                    <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-400">Orientação Religiosa</Label>
                <Select
                  value={userData.religious_orientation}
                  onValueChange={(v) => setUserData({ ...userData, religious_orientation: v })}
                >
                  <SelectTrigger className="mt-1.5 h-12 bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="catolico">Católico</SelectItem>
                    <SelectItem value="evangelico">Evangélico</SelectItem>
                    <SelectItem value="espirita">Espírita</SelectItem>
                    <SelectItem value="ateu">Ateu/Agnóstico</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                    <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-400">Orientação Política</Label>
                <Select
                  value={userData.political_orientation}
                  onValueChange={(v) => setUserData({ ...userData, political_orientation: v })}
                >
                  <SelectTrigger className="mt-1.5 h-12 bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="direita">Direita</SelectItem>
                    <SelectItem value="centro">Centro</SelectItem>
                    <SelectItem value="esquerda">Esquerda</SelectItem>
                    <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-400">Estado Civil</Label>
                <Select
                  value={userData.marital_status}
                  onValueChange={(v) => setUserData({ ...userData, marital_status: v })}
                >
                  <SelectTrigger className="mt-1.5 h-12 bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="solteiro">Solteiro</SelectItem>
                    <SelectItem value="casado">Casado</SelectItem>
                    <SelectItem value="divorciado">Divorciado</SelectItem>
                    <SelectItem value="viuvo">Viúvo</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        );

      case 'children':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
                <Baby className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-light text-white">Seus filhos</h2>
              <p className="text-zinc-500 mt-2 text-sm">Cadastre seus filhos para insights personalizados</p>
            </div>

            {children.length > 0 && (
              <div className="space-y-2 mb-6">
                {children.map((child, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 font-medium">
                        {child.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{child.name}</p>
                        <p className="text-sm text-zinc-500">
                          {child.age} anos • {child.gender === 'masculino' ? 'Menino' : child.gender === 'feminino' ? 'Menina' : 'Outro'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeChild(index)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border-2 border-dashed border-zinc-800 rounded-xl space-y-4">
              <p className="text-sm font-medium text-zinc-500">Adicionar filho</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Input
                    placeholder="Nome"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    className="h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Idade"
                  value={newChild.age}
                  onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                  className="h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
                <Select
                  value={newChild.gender}
                  onValueChange={(v) => setNewChild({ ...newChild, gender: v })}
                >
                  <SelectTrigger className="h-11 bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Sexo" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Hobby favorito"
                  value={newChild.favorite_hobby}
                  onChange={(e) => setNewChild({ ...newChild, favorite_hobby: e.target.value })}
                  className="h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
                <Input
                  placeholder="Cor favorita"
                  value={newChild.favorite_color}
                  onChange={(e) => setNewChild({ ...newChild, favorite_color: e.target.value })}
                  className="h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
                <Input
                  placeholder="Comida favorita"
                  value={newChild.favorite_food}
                  onChange={(e) => setNewChild({ ...newChild, favorite_food: e.target.value })}
                  className="h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
                <Input
                  placeholder="Filme favorito"
                  value={newChild.favorite_movie_genre}
                  onChange={(e) => setNewChild({ ...newChild, favorite_movie_genre: e.target.value })}
                  className="h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>

              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={addChild}
                disabled={!newChild.name || !newChild.age || !newChild.gender}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true;
      case 'about':
        return userData.age;
      case 'preferences':
        return true;
      case 'children':
        return children.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-8">
        <div className="flex gap-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-blue-400' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-2 text-center">
          Passo {currentStep + 1} de {steps.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 space-y-3">
        {currentStep === steps.length - 1 ? (
          <Button
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white font-medium"
            onClick={handleComplete}
            disabled={loading || !canProceed()}
          >
            {loading ? 'Salvando...' : 'Começar minha jornada'}
          </Button>
        ) : (
          <Button
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white font-medium"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Continuar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}

        {currentStep > 0 && (
          <Button
            variant="ghost"
            className="w-full text-zinc-500 hover:text-zinc-300"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}