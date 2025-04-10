import PDFWorkspace from '@/components/PDFWorkspace';

export default function Home() {
  return (
    <div className="window" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="title-bar">
        <div className="title-bar-text">Stapler</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      <div className="window-body" style={{ padding: '20px' }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          fontWeight: 'bold',
          fontSize: '28px'
        }}>
          Stapler
        </h1>
        
        <PDFWorkspace />
      </div>
    </div>
  );
} 