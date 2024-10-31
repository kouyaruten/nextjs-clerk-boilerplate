export default function Loader() {
  return (
    <div
      className="w-[40px] p-1 aspect-square rounded-full bg-gray-200 dark:bg-gray-800 animate-spin"
      style={{
        '--_m': 'conic-gradient(#0000 10%,#000), linear-gradient(#000 0 0) content-box',
        WebkitMask: 'var(--_m)',
        mask: 'var(--_m)',
        WebkitMaskComposite: 'source-out',
        maskComposite: 'subtract',
      }}
    />
  );
}
