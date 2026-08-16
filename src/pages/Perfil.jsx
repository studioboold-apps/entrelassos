import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, 
  Baby, 
  Plus, 
  Pencil, 
  Trash2, 
  LogOut
} from 'lucide-react';

const BRAND_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69693b3d8c5d3c2fd0c67ca4/bdaa51aa4_ChatGPTImage15_01_202616_47_55.png";

export default function Perfil() {
  const queryClient = useQueryClient();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [childForm, setChildForm] = useState({ name: '', age: '', gender: '' });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => base44.entities.Child.list(),
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['insightRatings'],
    queryFn: () => base44.entities.InsightRating.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
  });

  const [profileForm, setProfileForm] = useState({
    age: user?.age || '',
    sexual_orientation: user?.sexual_orientation || '',
    religious_orientation: user?.religious_orientation || '',
    political_orientation: user?.political_orientation || ''
  });

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        age: user.age || '',
        sexual_orientation: user.sexual_orientation || '',
        religious_orientation: user.religious_orientation || '',
        political_orientation: user.political_orientation || ''
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowEditProfile(false);
    },
  });

  const createChildMutation = useMutation({
    mutationFn: (data) => base44.entities.Child.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setShowAddChild(false);
      setChildForm({ name: '', age: '', gender: '' });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Child.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setEditingChild(null);
      setChildForm({ name: '', age: '', gender: '' });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: (id) => base44.entities.Child.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      ...profileForm,
      age: parseInt(profileForm.age)
    });
  };

  const handleSaveChild = () => {
    const data = { ...childForm, age: parseInt(childForm.age) };
    if (editingChild) {
      updateChildMutation.mutate({ id: editingChild.id, data });
    } else {
      createChildMutation.mutate(data);
    }
  };

  const openEditChild = (child) => {
    setChildForm({ name: child.name, age: child.age.toString(), gender: child.gender });
    setEditingChild(child);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const totalInsightsRated = ratings.length;
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 0;
  const completedActivities = activities.filter(a => a.completed).length;

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={BRAND_LOGO} alt="Entre Nós" className="w-12 h-12 rounded-xl" />
          <span className="text-blue-400 font-medium">Entre Nós</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400/20 to-emerald-400/20 border border-blue-400/30 flex items-center justify-center text-2xl font-light text-blue-400">
            {user?.full_name?.[0] || 'P'}
          </div>
          <div>
            <h1 className="text-xl font-light text-white">{user?.full_name || 'Pai'}</h1>
            <p className="text-zinc-500 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800"
          >
            <p className="text-2xl font-light text-white">{children.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Filhos</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800"
          >
            <p className="text-2xl font-light text-emerald-400">{completedActivities}</p>
            <p className="text-xs text-zinc-500 mt-1">Atividades</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800"
          >
            <p className="text-2xl font-light text-blue-400">{avgRating}⭐</p>
            <p className="text-xs text-zinc-500 mt-1">Média</p>
          </motion.div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 mb-6">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-white flex items-center gap-2">
              <User className="w-5 h-5 text-zinc-400" />
              Meu Perfil
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditProfile(true)}
              className="text-zinc-400 hover:text-white"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Idade</span>
              <span className="text-zinc-300">{user?.age || '-'} anos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Orientação Sexual</span>
              <span className="text-zinc-300 capitalize">{user?.sexual_orientation?.replace(/_/g, ' ') || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Religião</span>
              <span className="text-zinc-300 capitalize">{user?.religious_orientation?.replace(/_/g, ' ') || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Política</span>
              <span className="text-zinc-300 capitalize">{user?.political_orientation?.replace(/_/g, ' ') || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Children Section */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-white flex items-center gap-2">
            <Baby className="w-5 h-5 text-zinc-400" />
            Meus Filhos
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setChildForm({ name: '', age: '', gender: '' });
              setEditingChild(null);
              setShowAddChild(true);
            }}
            className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-medium text-lg">
                    {child.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-white">{child.name}</p>
                    <p className="text-sm text-zinc-500">
                      {child.age} anos • {child.gender === 'masculino' ? 'Menino' : child.gender === 'feminino' ? 'Menina' : 'Outro'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditChild(child)}
                    className="text-zinc-500 hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteChildMutation.mutate(child.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          {children.length === 0 && (
            <div className="text-center py-8 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
              <Baby className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500">Nenhum filho cadastrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-8">
        <Button
          variant="outline"
          className="w-full bg-transparent border-red-900/50 text-red-400 hover:bg-red-900/20"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da conta
        </Button>
      </div>

      {/* Brand */}
      <div className="px-4 mt-8 pb-8 text-center">
        <div className="flex items-center justify-center gap-2 text-zinc-600">
          <img src={BRAND_LOGO} alt="Entre Nós" className="w-6 h-6 rounded-md opacity-50" />
          <span className="text-sm">Entre Nós</span>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Idade</Label>
              <Input
                type="number"
                value={profileForm.age}
                onChange={(e) => setProfileForm(prev => ({ ...prev, age: e.target.value }))}
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Orientação Sexual</Label>
              <Select
                value={profileForm.sexual_orientation}
                onValueChange={(v) => setProfileForm(prev => ({ ...prev, sexual_orientation: v }))}
              >
                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
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
                value={profileForm.religious_orientation}
                onValueChange={(v) => setProfileForm(prev => ({ ...prev, religious_orientation: v }))}
              >
                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
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
                value={profileForm.political_orientation}
                onValueChange={(v) => setProfileForm(prev => ({ ...prev, political_orientation: v }))}
              >
                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="direita">Direita</SelectItem>
                  <SelectItem value="centro">Centro</SelectItem>
                  <SelectItem value="esquerda">Esquerda</SelectItem>
                  <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white"
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Child Dialog */}
      <Dialog open={showAddChild || editingChild !== null} onOpenChange={(open) => {
        if (!open) {
          setShowAddChild(false);
          setEditingChild(null);
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">{editingChild ? 'Editar Filho' : 'Adicionar Filho'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Nome</Label>
              <Input
                value={childForm.name}
                onChange={(e) => setChildForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do filho"
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Idade</Label>
              <Input
                type="number"
                value={childForm.age}
                onChange={(e) => setChildForm(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Idade"
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Sexo</Label>
              <Select
                value={childForm.gender}
                onValueChange={(v) => setChildForm(prev => ({ ...prev, gender: v }))}
              >
                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white"
              onClick={handleSaveChild}
              disabled={!childForm.name || !childForm.age || !childForm.gender || createChildMutation.isPending || updateChildMutation.isPending}
            >
              {(createChildMutation.isPending || updateChildMutation.isPending) ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}