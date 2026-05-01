import { useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateSession } from "@/hooks/useCreateSession";
import {
  validateAddress,
  NETWORK_ASSETS,
  NETWORK_LABELS,
  ASSET_LABELS,
} from "@/domain/session/validateAddress";
import type { SessionResponse } from "@/services/sessionsApi";
import { CheckCircle, AlertTriangle, Loader2, Copy } from "lucide-react";

type FormState = "idle" | "validating" | "submitting" | "success" | "error";

export default function NewSession() {
  const [network, setNetwork] = useState("");
  const [asset, setAsset] = useState("");
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>("idle");
  const [session, setSession] = useState<SessionResponse | null>(null);

  const mutation = useCreateSession();

  const availableAssets = network ? NETWORK_ASSETS[network] || [] : [];

  function handleNetworkChange(value: string) {
    setNetwork(value);
    const assets = NETWORK_ASSETS[value] || [];
    setAsset(assets.length === 1 ? assets[0] : "");
    setAddressError(null);
  }

  function handleAddressChange(value: string) {
    setAddress(value);
    if (addressError) setAddressError(null);
  }

  function handleAddressBlur() {
    if (network && address) {
      const err = validateAddress(network, address);
      setAddressError(err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setFormState("validating");
    const err = validateAddress(network, address);
    if (err) {
      setAddressError(err);
      setFormState("error");
      return;
    }
    if (!network || !asset) {
      toast.error("Please select network and asset.");
      setFormState("error");
      return;
    }

    setFormState("submitting");
    try {
      const result = await mutation.mutateAsync({
        network: network as "sepolia" | "btc_testnet",
        asset: asset as "ETH" | "BTC",
        output_address: address.trim(),
      });
      setSession(result);
      setFormState("success");
      toast.success("Session created successfully!");
    } catch (err: unknown) {
      setFormState("error");
      const message = err instanceof Error ? err.message : "Failed to create session";
      toast.error(message);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (formState === "success" && session) {
    return (
      <Layout>
        <div className="container max-w-lg mx-auto py-16 px-4">
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-mono font-bold text-foreground">
                Session Created
              </h1>
            </div>

            <Alert className="bg-muted border-border">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-muted-foreground">
                Testnet Only — No Real Funds
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {[
                { label: "Session Code", value: session.session_code },
                { label: "Network", value: NETWORK_LABELS[session.network] || session.network },
                { label: "Asset", value: session.asset },
                { label: "Output Address", value: session.output_address },
                { label: "Status", value: session.status },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    {item.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-foreground break-all">
                      {item.value}
                    </p>
                    {(item.label === "Session Code" || item.label === "Output Address") && (
                      <button
                        onClick={() => copyToClipboard(item.value)}
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => {
                setFormState("idle");
                setSession(null);
                setNetwork("");
                setAsset("");
                setAddress("");
              }}
              variant="outline"
              className="w-full"
            >
              Create Another Session
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-lg mx-auto py-16 px-4">
        <div className="bg-card border border-border rounded-xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-mono font-bold text-foreground">
              New Wallet Session
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Initialize a testnet wallet session
            </p>
          </div>

          <Alert className="bg-muted border-border">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-muted-foreground">
              Testnet Only — No Real Funds
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Network */}
            <div className="space-y-2">
              <Label htmlFor="network" className="text-sm font-mono">
                Network
              </Label>
              <Select value={network} onValueChange={handleNetworkChange}>
                <SelectTrigger id="network">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NETWORK_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Asset */}
            <div className="space-y-2">
              <Label htmlFor="asset" className="text-sm font-mono">
                Asset
              </Label>
              <Select
                value={asset}
                onValueChange={setAsset}
                disabled={!network}
              >
                <SelectTrigger id="asset">
                  <SelectValue placeholder={network ? "Select asset" : "Select network first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.map((a) => (
                    <SelectItem key={a} value={a}>
                      {ASSET_LABELS[a] || a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Output Address */}
            <div className="space-y-2">
              <Label htmlFor="output_address" className="text-sm font-mono">
                Output Address
              </Label>
              <Input
                id="output_address"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onBlur={handleAddressBlur}
                placeholder={
                  network === "sepolia"
                    ? "0x..."
                    : network === "btc_testnet"
                    ? "tb1... / m... / n..."
                    : "Select network first"
                }
                className={`font-mono text-sm ${addressError ? "border-destructive" : ""}`}
                disabled={!network}
              />
              {addressError && (
                <p className="text-sm text-destructive">{addressError}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={formState === "submitting" || !network || !asset || !address}
            >
              {formState === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                "Create Session"
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
