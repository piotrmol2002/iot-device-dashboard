import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import DeviceStatus from './components/DeviceStatus';
import Charts from './components/Charts';
import GlobalChart from './components/GlobalChart';
import { Box, Button, Grid } from '@mui/material';
//import "./App.css";
import DeleteReadingsModal from './components/DeleteReadingsModal';
import './Dashboard.css';

const Dashboard = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceHistory, setDeviceHistory] = useState<any[]>([]);
  const [deviceDiffAlerts, setDeviceDiffAlerts] = useState<{ [deviceId: number]: boolean }>({});
  const [globalHistory, setGlobalHistory] = useState<any[]>([]);
  const [showGlobalChart, setShowGlobalChart] = useState(false); // <-- NOWY STAN

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch("http://localhost:3100/api/data/hour", {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
      }
    })
      .then(res => res.json())
      .then(data => setGlobalHistory(data))
      .catch(() => setGlobalHistory([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch("http://localhost:3100/api/data/latest", {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized or fetch failed");
        return res.json();
      })
      .then(data => {
        setDevices(data);
      })
      .catch(err => {
        console.error("Fetch failed:", err);
      });
  }, []);

  useEffect(() => {
    if (selectedDeviceId !== null) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:3100/api/data/${selectedDeviceId}`, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Unauthorized or fetch failed");
          return res.json();
        })
        .then(data => setDeviceHistory(data))
        .catch(() => setDeviceHistory([]));
    } else {
      setDeviceHistory([]);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!devices.length) return;

    const fetchDiffs = async () => {
      const alerts: { [deviceId: number]: boolean } = {};
      await Promise.all(devices.map(async (device) => {
        if (!device || device.data === null) {
          alerts[device.id] = false;
          return;
        }
        const resp = await fetch(`http://localhost:3100/api/data/${device.id}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-auth-token': token || ''
          }
        });
        const history = await resp.json();
        if (history.length < 2) {
          alerts[device.id] = false;
          return;
        }
        // ost i przedost odczyt
        const latest = history[history.length - 1];
        const previous = history[history.length - 2];
        // 20%
        const diffExceeded =
          Math.abs(latest.temperature - previous.temperature) / Math.max(Math.abs(previous.temperature), 1) > 0.2 ||
          Math.abs(latest.pressure - previous.pressure) / Math.max(Math.abs(previous.pressure), 1) > 0.2 ||
          Math.abs(latest.humidity - previous.humidity) / Math.max(Math.abs(previous.humidity), 1) > 0.2;
        alerts[device.id] = diffExceeded;
      }));
      setDeviceDiffAlerts(alerts);
    };

    fetchDiffs();
  }, [devices]);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  const handleShowGlobalChart = () => {
    setShowGlobalChart(true);
    setSelectedDeviceId(null); // chowaj device
  };

  const handleSelectDevice = (id: number) => {
    setShowGlobalChart(false); // chowaj global
    setSelectedDeviceId(id);
  };

  return (
    <>
      <Navbar />

      <Box className="global-chart-button">
  <Button
    variant={showGlobalChart ? "contained" : "outlined"}
    color="secondary"
    onClick={handleShowGlobalChart}
  >
    Wykres zbiorczy (ostatnia godzina)
  </Button>
</Box>

      {showGlobalChart && <GlobalChart data={globalHistory} />}

      {!showGlobalChart && (
        <Box sx={{ display: 'flex', p: 2 }}>
          {selectedDevice && selectedDevice.data && (
            <Box sx={{ mr: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DeviceStatus
                deviceId={selectedDevice.id}
                data={selectedDevice.data}
                onSelect={() => {}}
                hideDetailsButton
                alert={deviceDiffAlerts[selectedDevice.id]}
              />
              <Button
                variant="contained"
                color="error"
                onClick={() => setShowDeleteModal(true)}
                sx={{ mt: 2 }}
              >
                Usuń odczyty z zakresu
              </Button>
            </Box>
          )}
          <Charts selectedDevice={selectedDevice} history={deviceHistory} />
        </Box>
      )}

      <Grid container spacing={2} sx={{ p: 2 }}>
        {devices.map((device) => (
          <Grid item key={device.id}>
            <DeviceStatus
              deviceId={device.id}
              data={device.data}
              onSelect={handleSelectDevice}
              alert={deviceDiffAlerts[device.id]}
            />
          </Grid>
        ))}
      </Grid>
      {selectedDevice && (
        <DeleteReadingsModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={(from, to) => {
            const token = localStorage.getItem('token');
            fetch(`http://localhost:3100/api/data/${selectedDevice.id}/range`, {
              method: "DELETE",
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token || ''
              },
              body: JSON.stringify({ from, to })
            })
              .then(res => res.json())
              .then(() => {
                fetch("http://localhost:3100/api/data/latest", {
                  method: "GET",
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                  }
                })
                  .then(res => {
                    if (!res.ok) throw new Error("Unauthorized or fetch failed");
                    return res.json();
                  })
                  .then(data => {
                    setDevices(data);
                  })
                  .catch(err => {
                    console.error("Fetch failed:", err);
                  });

                if (selectedDeviceId !== null) {
                  fetch(`http://localhost:3100/api/data/${selectedDeviceId}`, {
                    method: "GET",
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                      'x-auth-token': token || ''
                    }
                  })
                    .then(res => res.json())
                    .then(data => setDeviceHistory(data))
                    .catch(() => setDeviceHistory([]));
                }
                setShowDeleteModal(false);
              });
          }}
        />
      )}
    </>
  );
};

export default Dashboard;
