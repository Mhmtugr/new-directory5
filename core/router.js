import { Orders } from '../modules/orders/orders.js';
import { Production } from '../modules/production/production.js';
import { Stock } from '../modules/stock/stock.js';
import { Purchasing } from '../modules/purchasing/purchasing.js';

class Router {
    constructor() {
        this.routes = {
            '/': this.loadHomePage,
            '/orders': this.loadOrdersPage,
            '/production': this.loadProductionPage,
            '/stock': this.loadStockPage,
            '/purchasing': this.loadPurchasingPage
        };
        
        this.currentModule = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Sidebar linklerine tıklama olayları
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.target.closest('.nav-link').dataset.route;
                this.navigate(route);
            });
        });

        // Tarayıcı geri/ileri butonları
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname);
        });
    }

    async navigate(route) {
        if (!this.routes[route]) {
            console.error('Route bulunamadı:', route);
            return;
        }

        // Aktif modülü temizle
        if (this.currentModule) {
            this.currentModule.cleanup();
        }

        // Yeni sayfayı yükle
        await this.routes[route].call(this);

        // URL'i güncelle
        window.history.pushState({}, '', route);

        // Aktif linki güncelle
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.route === route) {
                link.classList.add('active');
            }
        });
    }

    async loadHomePage() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="container mt-4">
                <h1>Hoş Geldiniz</h1>
                <p>MehmetEndüstriyel Takip Sistemine hoş geldiniz.</p>
            </div>
        `;
    }

    async loadOrdersPage() {
        const mainContent = document.getElementById('main-content');
        const response = await fetch('modules/orders/orders.html');
        mainContent.innerHTML = await response.text();
        this.currentModule = new Orders();
        await this.currentModule.init();
    }

    async loadProductionPage() {
        const mainContent = document.getElementById('main-content');
        const response = await fetch('modules/production/production.html');
        mainContent.innerHTML = await response.text();
        this.currentModule = new Production();
        await this.currentModule.init();
    }

    async loadStockPage() {
        const mainContent = document.getElementById('main-content');
        const response = await fetch('modules/stock/stock.html');
        mainContent.innerHTML = await response.text();
        this.currentModule = new Stock();
        await this.currentModule.init();
    }

    async loadPurchasingPage() {
        const mainContent = document.getElementById('main-content');
        const response = await fetch('modules/purchasing/purchasing.html');
        mainContent.innerHTML = await response.text();
        this.currentModule = new Purchasing();
        await this.currentModule.init();
    }
}

// Router'ı başlat
const router = new Router();

// Sayfa yüklendiğinde ana sayfaya yönlendir
document.addEventListener('DOMContentLoaded', () => {
    router.navigate('/');
});

export { router }; 