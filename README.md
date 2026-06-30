# Minimagic - Toy Store Home Page

A modern, responsive home page for the Minimagic toy store built with **Next.js 14** and **Tailwind CSS**.

## 🎨 Features

- **Hero Section**: Eye-catching welcome section with "Find Joy in Every Toy" headline
- **Categories**: Browse toys, bags, umbrellas, stationery, and household items
- **Popular Toys**: Showcase of best-selling products
- **Promotions**: Special offers and discounts
- **New Arrivals**: Latest products added to inventory
- **Why Choose Minimagic**: Feature highlights section
- **Responsive Design**: Mobile-first approach with full responsiveness
- **Modern UI**: Clean design with vibrant colors matching the reference

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Run the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
mini magic/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── Hero.tsx            # Hero section
│   ├── Categories.tsx      # Categories grid
│   ├── PopularToys.tsx     # Popular products section
│   ├── Promotions.tsx      # Promotional banners
│   ├── NewArrivals.tsx     # New products section
│   ├── Features.tsx        # Why Choose Minimagic
│   └── Footer.tsx          # Footer with links
├── public/
│   └── logo.svg            # Minimagic logo
├── package.json            # Project dependencies
├── tailwind.config.js      # Tailwind configuration
├── next.config.js          # Next.js configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎨 Customization

### Colors
Modify colors in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#F4C430',    // Yellow
      secondary: '#003DA5',  // Blue
      lightYellow: '#FFFACD',
    },
  },
}
```

### Content
- Edit component files in `/components` to update content
- Update product data in respective components
- Modify footer links and social media

### Images
Replace placeholder product images:
1. Add your images to `/public`
2. Update component imports to use real images instead of emojis

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create optimized production build
- `npm start` - Run production server
- `npm run lint` - Run ESLint

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎯 Next Steps

1. **Add Product Data**: Replace mock data with real product information
2. **Integrate Backend**: Connect to your backend API
3. **Add Database**: Implement product management
4. **User Authentication**: Add login/register functionality
5. **Shopping Cart**: Implement shopping cart feature
6. **Payment Integration**: Add payment gateway

## 📄 License

This project is private and proprietary to Minimagic.

## 💡 Support

For issues or questions, please contact: minimagic@gmail.com

---

**Built with ❤️ using Next.js and Tailwind CSS**
