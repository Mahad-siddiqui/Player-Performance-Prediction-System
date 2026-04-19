import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Cpu, RefreshCw, Upload, CheckCircle, AlertCircle,
  Clock, Users, Activity, Zap, Server, TrendingUp, Shield,
  FileText, BarChart2, Wifi,
} from 'lucide-react';
import BentoCard from '../components/BentoCard';
import StatBadge from '../components/StatBadge';
import { fetchAdminDashboard, generateAllPredictions, trainModels, uploadCsvFile } from '../services/api';

function StatusDot({ status }: { status: 'synced' | 'syncing' | 'error' }) {
  if (status === 'synced') return <div className="w-2 h-2 rounded-full bg-neon-green" />;
  if (status === 'syncing') return <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />;
  return <div className="w-2 h-2 rounded-full bg-neon-red" />;
}

interface UploadedFile {
  name: string;
  size: string;
  rows: number;
  status: 'processing' | 'done' | 'error';
}

export default function AdminDashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [apiStatuses, setApiStatuses] = useState<Array<{ name: string; status: 'synced' | 'syncing' | 'error'; lastSync: string; records: number }>>([]);
  const [metrics, setMetrics] = useState({ players: 0, matches: 0, wellnessRecords: 0, predictions: 0, accuracy: 0, uptime: 0 });
  const [modelPerformance, setModelPerformance] = useState<Array<{ label: string; accuracy: number; model: string }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ time: string; msg: string; type: 'success' | 'error' | 'info' }>>([]);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [systemLoad, setSystemLoad] = useState({ cpu: 0, memory: 0, mlQueue: 0, storage: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const payload = await fetchAdminDashboard();
      setMetrics(payload.metrics);
      setApiStatuses(payload.apiSync);
      setSystemLoad(payload.systemLoad);
      setModelPerformance(payload.modelPerformance);
      setRecentActivity(payload.recentActivity);
    } catch {
      // Keep existing state if backend call fails.
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
    if (!files.length) return;
    processFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(f => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      rows: 0,
      status: 'processing' as const,
    }));
    setUploadedFiles(prev => [...newFiles, ...prev]);

    for (let idx = 0; idx < files.length; idx += 1) {
      const file = files[idx];
      try {
        const result = await uploadCsvFile(file);
        setUploadedFiles(prev =>
          prev.map((f, i) =>
            i === idx
              ? { ...f, status: 'done' as const, rows: result.inserted }
              : f
          )
        );
      } catch {
        setUploadedFiles(prev =>
          prev.map((f, i) =>
            i === idx
              ? { ...f, status: 'error' as const }
              : f
          )
        );
      }
    }

    try {
      await trainModels();
      await generateAllPredictions();
    } catch {
      // Training requires enough rows; ingestion itself is still successful.
    }

    loadDashboard();
  };

  const handleRefreshApi = (name: string) => {
    setRefreshingId(name);
    setTimeout(() => {
      loadDashboard();
      setRefreshingId(null);
    }, 900);
  };

  const now = new Date();

  return (
    <div className="min-h-screen bg-mesh pt-16 px-4 pb-4 md:px-6 md:pb-6">
      <div className="max-w-[1600px] mx-auto space-y-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-neon-cyan" />
              <h1 className="text-2xl font-bold text-white">System Control</h1>
            </div>
            <p className="text-gray-500 text-sm">
              {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green/10 border border-neon-green/20">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-green" />
                <div className="absolute inset-0 rounded-full bg-neon-green animate-ping opacity-60" />
              </div>
              <span className="text-neon-green text-sm font-semibold">All Systems Operational</span>
            </div>
            <button
              onClick={loadDashboard}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Players', value: metrics.players, icon: Users, color: 'text-neon-green', bg: 'bg-neon-green/10' },
            { label: 'Matches', value: metrics.matches.toLocaleString(), icon: Activity, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
            { label: 'Wellness', value: metrics.wellnessRecords.toLocaleString(), icon: Zap, color: 'text-neon-orange', bg: 'bg-neon-orange/10' },
            { label: 'Predictions', value: metrics.predictions.toLocaleString(), icon: TrendingUp, color: 'text-neon-green', bg: 'bg-neon-green/10' },
            { label: 'ML Accuracy', value: `${metrics.accuracy}%`, icon: Cpu, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
            { label: 'Uptime', value: `${metrics.uptime}%`, icon: Server, color: 'text-neon-green', bg: 'bg-neon-green/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <BentoCard key={label} neonColor="green" className="p-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <div className={`text-2xl font-black ${color} font-mono`}>{value}</div>
              <div className="text-gray-500 text-xs mt-0.5 font-medium">{label}</div>
            </BentoCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <BentoCard neonColor="cyan" className="h-full">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Upload size={18} className="text-neon-cyan" />
                  <h2 className="text-lg font-bold text-white">Data Ingestion</h2>
                  <StatBadge label="CSV" variant="info" size="sm" />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-lg neon-btn"
                >
                  Browse Files
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-300
                  ${isDragging
                    ? 'border-neon-cyan bg-neon-cyan/10 scale-[1.01]'
                    : 'border-white/10 hover:border-neon-cyan/30 hover:bg-neon-cyan/5'
                  }
                `}
              >
                <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                  <div className="w-14 h-14 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mx-auto mb-4">
                    <Upload size={28} className="text-neon-cyan" />
                  </div>
                  <p className="text-white font-semibold mb-1">
                    {isDragging ? 'Drop your CSV files here' : 'Drag & drop CSV files'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Players, match stats, wellness records — supports bulk upload
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    {['players.csv', 'matches.csv', 'wellness.csv'].map(t => (
                      <span key={t} className="text-[10px] text-gray-600 bg-white/5 px-2 py-1 rounded font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Upload Queue</div>
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <FileText size={14} className="text-neon-cyan" />
                        <div>
                          <div className="text-sm font-medium text-white">{file.name}</div>
                          <div className="text-xs text-gray-500">{file.size} · {file.rows} rows</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'processing' && (
                          <div className="w-4 h-4 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
                        )}
                        {file.status === 'done' && <CheckCircle size={16} className="text-neon-green" />}
                        {file.status === 'error' && <AlertCircle size={16} className="text-neon-red" />}
                        <StatBadge
                          label={file.status === 'processing' ? 'Processing' : file.status === 'done' ? 'Done' : 'Error'}
                          variant={file.status === 'done' ? 'success' : file.status === 'error' ? 'danger' : 'info'}
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </BentoCard>
          </div>

          <BentoCard neonColor="green">
            <div className="flex items-center gap-2 mb-5">
              <Wifi size={18} className="text-neon-green" />
              <h2 className="text-lg font-bold text-white">API Sync</h2>
            </div>
            <div className="space-y-3">
              {apiStatuses.map((api) => (
                <div key={api.name} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusDot status={api.status as 'synced' | 'syncing' | 'error'} />
                      <span className="text-sm font-medium text-white">{api.name}</span>
                    </div>
                    <button
                      onClick={() => handleRefreshApi(api.name)}
                      disabled={refreshingId === api.name}
                      className="p-1 rounded text-gray-500 hover:text-neon-green transition-colors"
                    >
                      <RefreshCw
                        size={12}
                        className={refreshingId === api.name ? 'animate-spin text-neon-cyan' : ''}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock size={10} />
                      <span>{api.lastSync}</span>
                    </div>
                    {api.status === 'error' ? (
                      <StatBadge label="Error" variant="danger" size="sm" />
                    ) : (
                      <span className="text-xs font-mono text-gray-400">{api.records.toLocaleString()} rec</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <BentoCard neonColor="cyan">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-neon-cyan" />
                <span className="text-sm font-semibold text-white">System Load</span>
              </div>
              <StatBadge label={`${systemLoad.cpu}%`} variant={systemLoad.cpu > 70 ? 'danger' : 'info'} size="sm" />
            </div>
            <div className="space-y-3">
              {[
                { label: 'CPU', value: systemLoad.cpu, color: 'bg-neon-cyan' },
                { label: 'Memory', value: systemLoad.memory, color: 'bg-neon-green' },
                { label: 'ML Queue', value: systemLoad.mlQueue, color: 'bg-neon-orange' },
                { label: 'Storage', value: systemLoad.storage, color: 'bg-neon-cyan' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-300 font-mono">{value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard neonColor="green">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={16} className="text-neon-green" />
              <span className="text-sm font-semibold text-white">Model Performance</span>
            </div>
            <div className="space-y-3">
              {modelPerformance.map(({ label, accuracy, model }) => (
                <div key={label} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                  <div>
                    <div className="text-xs font-medium text-white">{label}</div>
                    <div className="text-[10px] text-gray-600">{model}</div>
                  </div>
                  <StatBadge
                    label={`${accuracy}%`}
                    variant={accuracy > 75 ? 'success' : accuracy > 60 ? 'warning' : 'danger'}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard neonColor="orange">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-neon-orange" />
              <span className="text-sm font-semibold text-white">Recent Activity</span>
            </div>
            <div className="space-y-2 text-xs">
              {recentActivity.map(({ time, msg, type }, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                    type === 'success' ? 'bg-neon-green' :
                    type === 'error' ? 'bg-neon-red' : 'bg-neon-cyan'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-300 leading-tight">{msg}</div>
                    <div className="text-gray-600 text-[10px]">{time}</div>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
