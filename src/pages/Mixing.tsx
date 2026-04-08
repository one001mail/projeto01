import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, Loader2, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MixStatus = "idle" | "submitting" | "processing" | "complete";

const Mixing = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("BTC");
  const [outputAddress, setOutputAddress] = useState("");
  const [delay, setDelay] = useState([6]);
  const [status, setStatus] = useState<MixStatus>("idle");
  const [sessionId, setSessionId] = useState("");

  const fee = amount ? (parseFloat(amount) * 0.025).toFixed(6) : "0";
  const netAmount = amount ? (parseFloat(amount) - parseFloat(fee)).toFixed(6) : "0";

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    if (!outputAddress.trim()) {
      toast({ title: "Missing address", description: "Please enter an output address.", variant: "destructive" });
      return;
    }

    setStatus("submitting");

    // SIMULATED — no real transaction
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("processing");
    await new Promise((r) => setTimeout(r, 2500));

    const id = `MIX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setSessionId(id);
    setStatus("complete");

    toast({ title: "Mix Session Created", description: `Session ${id} is now processing.` });
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast({ title: "Copied", description: "Session ID copied to clipboard." });
  };

  if (status === "complete") {
    return (
      <Layout>
        <section className="py-20">
          <div className="container max-w-lg">
            <div className="glass-card p-8 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Mix Session Created</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Your simulated mixing session is being processed.
              </p>

              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1 font-mono">SESSION ID</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-primary font-mono font-semibold">{sessionId}</code>
                  <button onClick={copySessionId} className="text-muted-foreground hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-left space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono">{amount} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee (2.5%)</span>
                  <span className="font-mono">{fee} {currency}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Net Output</span>
                  <span className="font-mono text-primary font-semibold">{netAmount} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delay</span>
                  <span className="font-mono">{delay[0]}h</span>
                </div>
              </div>

              <div className="glass-card p-3 border-warning/30 mb-6">
                <p className="text-xs text-muted-foreground">
                  <span className="text-warning font-mono">⚠ SIMULATED</span> — No real transaction has been executed.
                </p>
              </div>

              <Button variant="hero" onClick={() => { setStatus("idle"); setAmount(""); setOutputAddress(""); setSessionId(""); }}>
                New Mix Session
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="container max-w-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Start a <span className="text-gradient-green">Mix</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Configure your mixing parameters below. All fields are required.
          </p>

          <div className="glass-card p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="amount" className="text-xs font-mono text-muted-foreground">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 font-mono bg-muted border-border"
                  disabled={status !== "idle"}
                />
              </div>
              <div>
                <Label className="text-xs font-mono text-muted-foreground">Currency</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={status !== "idle"}>
                  <SelectTrigger className="mt-1 font-mono bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="LTC">LTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="output" className="text-xs font-mono text-muted-foreground">Output Address</Label>
              <Input
                id="output"
                placeholder="Enter receiving address"
                value={outputAddress}
                onChange={(e) => setOutputAddress(e.target.value)}
                className="mt-1 font-mono bg-muted border-border text-sm"
                disabled={status !== "idle"}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs font-mono text-muted-foreground">Time Delay</Label>
                <span className="text-xs font-mono text-primary">{delay[0]} hours</span>
              </div>
              <Slider
                value={delay}
                onValueChange={setDelay}
                min={1}
                max={72}
                step={1}
                disabled={status !== "idle"}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">1h</span>
                <span className="text-xs text-muted-foreground">72h</span>
              </div>
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee (2.5%)</span>
                  <span className="font-mono">{fee} {currency}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">You Receive</span>
                  <span className="font-mono text-primary">{netAmount} {currency}</span>
                </div>
              </div>
            )}

            <div className="glass-card p-3 border-warning/30">
              <p className="text-xs text-muted-foreground">
                <span className="text-warning font-mono">⚠ DISCLAIMER:</span> This is a simulated service. No real crypto is mixed.
              </p>
            </div>

            <Button
              variant="hero"
              className="w-full"
              onClick={handleSubmit}
              disabled={status !== "idle"}
            >
              {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "idle" && "Create Mix Session"}
              {status === "submitting" && "Validating..."}
              {status === "processing" && "Processing..."}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Mixing;
