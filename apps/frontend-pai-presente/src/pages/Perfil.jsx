import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  User, 
  Baby, 
  Plus, 
  Pencil, 
  Trash2, 
  LogOut
} from 'lucide-react';
import { BRAND_LOGO } from '@/lib/brand';
import { describeApiFailure } from '@/lib/api-error-message';
import { toProfileUpdate } from '@/lib/profile-form';
import { toAverageGrade } from '@/lib/average-grade';


export default function Perfil() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [childToDelete, setChildToDelete] = useState(null);
  const [childForm, setChildForm] = useState({ name: '', age: '', gender: '', favorite_hobby: '', favorite_color: '', favorite_food: '', favorite_movie_genre: '' });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.entities.Child.list(),
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['insightRatings'],
    queryFn: () => api.entities.InsightRating.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => api.entities.Activity.list(),
  });

  /**
   * O formulario e' preenchido quando o dialogo ABRE, e nao a cada resposta
   * nova da consulta do usuario. Do jeito antigo bastava a janela reganhar o
   * foco no meio da edicao para a busca se refazer e apagar por baixo o que o
   * pai estava digitando.
   */
  const [profileForm, setProfileForm] = useState({ age: '', marital_status: '' });

  const openEditProfile = () => {
    setProfileForm({ age: user?.age ?? '', marital_status: user?.marital_status ?? '' });
    updateProfileMutation.reset();
    setShowEditProfile(true);
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowEditProfile(false);
    },
  });

  const createChildMutation = useMutation({
    mutationFn: (data) => api.entities.Child.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setShowAddChild(false);
      setChildForm({ name: '', age: '', gender: '', favorite_hobby: '', favorite_color: '', favorite_food: '', favorite_movie_genre: '' });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Child.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setEditingChild(null);
      setChildForm({ name: '', age: '', gender: '', favorite_hobby: '', favorite_color: '', favorite_food: '', favorite_movie_genre: '' });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: (id) => api.entities.Child.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });

  /**
   * Tres escritas, tres avisos. Antes, qualquer recusa da API morria no
   * `onError` que nao existia: o dialogo continuava aberto e mudo, e o pai
   * clicava em Salvar de novo achando que o toque nao tinha pegado.
   */
  const profileFailure = updateProfileMutation.isError
    ? describeApiFailure(updateProfileMutation.error)
    : null;
  const childFailure = createChildMutation.isError
    ? describeApiFailure(createChildMutation.error)
    : updateChildMutation.isError
      ? describeApiFailure(updateChildMutation.error)
      : null;
  const deleteFailure = deleteChildMutation.isError
    ? describeApiFailure(deleteChildMutation.error)
    : null;

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(toProfileUpdate(profileForm));
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
    setChildForm({
      name: child.name,
      age: child.age.toString(),
      gender: child.gender,
      favorite_hobby: child.favorite_hobby || '',
      favorite_color: child.favorite_color || '',
      favorite_food: child.favorite_food || '',
      favorite_movie_genre: child.favorite_movie_genre || ''
    });
    setEditingChild(child);
  };

  /**
   * Sair passa pelo contexto: chamar a API direto derruba o cookie e deixa o
   * `user` em memoria, e a tela continua mostrando o pai que acabou de sair.
   */
  const handleLogout = () => {
    logout();
  };

  /**
   * Sem nota nenhuma, o cartao mostrava `0` — que e' a PIOR nota possivel, nao
   * a ausencia dela. O modulo comum devolve nada nesse caso, e a tela escreve
   * um traco; a mesma conta e' a do boletim, e por isso mora num lugar so.
   */
  const avgRating = toAverageGrade(ratings.filter((r) => r.rating).map((r) => r.rating));
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
            <p className="text-2xl font-light text-blue-400">{avgRating === undefined ? '—' : `${avgRating}⭐`}</p>
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
              onClick={openEditProfile}
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
              <span className="text-zinc-500">Estado Civil</span>
              <span className="text-zinc-300 capitalize">{user?.marital_status?.replace(/_/g, ' ') || '-'}</span>
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
              setChildForm({ name: '', age: '', gender: '', favorite_hobby: '', favorite_color: '', favorite_food: '', favorite_movie_genre: '' });
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
                    onClick={() => setChildToDelete(child)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          {deleteFailure && (
            <p role="alert" className="text-sm text-red-400 px-1">
              {deleteFailure.message}
            </p>
          )}

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
              <Label className="text-zinc-400">Estado Civil</Label>
              <Select
                value={profileForm.marital_status}
                onValueChange={(v) => setProfileForm(prev => ({ ...prev, marital_status: v }))}
              >
                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="solteiro">Solteiro</SelectItem>
                  <SelectItem value="casado">Casado</SelectItem>
                  <SelectItem value="divorciado">Divorciado</SelectItem>
                  <SelectItem value="viuvo">Viúvo</SelectItem>
                  <SelectItem value="uniao_estavel">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {profileFailure && (
              <p role="alert" className="text-sm text-red-400">
                {profileFailure.message}
              </p>
            )}

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

            <div>
              <Label className="text-zinc-400">Hobby Favorito</Label>
              <Input
                value={childForm.favorite_hobby || ''}
                onChange={(e) => setChildForm(prev => ({ ...prev, favorite_hobby: e.target.value }))}
                placeholder="Ex: Futebol, desenho..."
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Cor Favorita</Label>
              <Input
                value={childForm.favorite_color || ''}
                onChange={(e) => setChildForm(prev => ({ ...prev, favorite_color: e.target.value }))}
                placeholder="Ex: Azul, vermelho..."
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Comida Favorita</Label>
              <Input
                value={childForm.favorite_food || ''}
                onChange={(e) => setChildForm(prev => ({ ...prev, favorite_food: e.target.value }))}
                placeholder="Ex: Pizza, macarrão..."
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Estilo de Filme Favorito</Label>
              <Input
                value={childForm.favorite_movie_genre || ''}
                onChange={(e) => setChildForm(prev => ({ ...prev, favorite_movie_genre: e.target.value }))}
                placeholder="Ex: Animação, aventura..."
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>

            {childFailure && (
              <p role="alert" className="text-sm text-red-400">
                {childFailure.message}
              </p>
            )}

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

      {/*
        Apagar filho e' irreversivel e leva junto sete campos que o pai digitou
        um por um. Disparava no toque, sem pergunta: um encostao na lista e o
        cadastro sumia sem nem um aviso na tela.
      */}
      <AlertDialog open={childToDelete !== null} onOpenChange={(open) => { if (!open) setChildToDelete(null); }}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Apagar {childToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              O cadastro e tudo o que voce preencheu sobre ele serao apagados. Nao da para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (childToDelete !== null) deleteChildMutation.mutate(childToDelete.id);
                setChildToDelete(null);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}