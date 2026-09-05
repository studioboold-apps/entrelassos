import Boletim from './pages/Boletim';
import Chat from './pages/Chat';
import Comunidade from './pages/Comunidade';
import Home from './pages/Home';
import Juntinhos from './pages/Juntinhos';
import Onboarding from './pages/Onboarding';
import Perfil from './pages/Perfil';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Boletim": Boletim,
    "Chat": Chat,
    "Comunidade": Comunidade,
    "Home": Home,
    "Juntinhos": Juntinhos,
    "Onboarding": Onboarding,
    "Perfil": Perfil,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};