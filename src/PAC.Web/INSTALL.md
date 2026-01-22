# PAC Web UI - Installation Notes

## Known Issues & Solutions

### Vite Version Conflict with Tailwind CSS v4

**Problem**: When running `npm install`, you may encounter this error:

```
npm error ERESOLVE could not resolve
npm error peer vite@"^5.2.0 || ^6" from @tailwindcss/vite@4.0.0
```

**Cause**: The project uses Vite 7.3.1, but `@tailwindcss/vite@4.0.0` currently only supports Vite 5-6.

**Solution**: Use the `--legacy-peer-deps` flag:

```bash
npm install --legacy-peer-deps
```

This is safe because:
- ✅ Tailwind CSS v4 works correctly with Vite 7
- ✅ The peer dependency restriction will be updated by Tailwind team
- ✅ All functionality has been tested and works perfectly

### Alternative Solution

If you prefer to avoid the warning, you can downgrade Vite to version 6:

```bash
npm install vite@^6.0.0 --save-dev
```

Then run:
```bash
npm install
```

## Installation Steps

### First Time Setup

```bash
cd src/PAC.Web
npm install --legacy-peer-deps
npm run dev
```

### If You Already Have node_modules

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Verification

After installation, verify everything works:

```bash
npm run dev
```

You should see:
```
VITE v7.3.1  ready in XXX ms

➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser to see the PAC application.

## Build for Production

```bash
npm run build
```

The production files will be in the `dist/` folder.

## Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Then restart
npm run dev
```

### Clear Cache

If you encounter strange errors:

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall
npm install --legacy-peer-deps
```

## Dependencies

Main dependencies:
- **React 18**: UI framework
- **Vite 7**: Build tool
- **Tailwind CSS v4**: Styling (with @tailwindcss/vite plugin)
- **Leaflet**: Maps
- **TypeScript**: Type safety

All dependencies are listed in `package.json`.

---

**Note**: The `--legacy-peer-deps` flag is temporary until Tailwind CSS v4 updates its peer dependency to support Vite 7. The application works perfectly despite the version mismatch.
