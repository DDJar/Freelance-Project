import { Header } from '../../components/library/header/Header';
import Footer from '../../components/library/footer/Footer';
import './default-layout.scss';
import FloatingContact from '../../components/library/floating-contact/FloatingContact';
export function DefaultLayout({ children }) {
    return (
        <div className='default-layout'>
            <Header />
            <main>
                {children}
            </main>
            <Footer />
            <FloatingContact />
        </div>
    )
};