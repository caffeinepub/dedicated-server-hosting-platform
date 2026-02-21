import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Server, Zap, Shield, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:50px_50px]" />
        <div className="container relative py-24 md:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Enterprise-Grade
                  <span className="block bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
                    Dedicated Servers
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground md:text-xl max-w-2xl">
                  Power your business with high-performance dedicated servers. Full control, maximum reliability, and unmatched performance.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base">
                  <Link to="/plans">View Server Plans</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base">
                  <Link to="/dashboard">Get Started</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="/assets/generated/datacenter-hero.dim_1200x600.jpg"
                alt="Data Center"
                className="rounded-lg shadow-2xl border border-border/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why Choose ServerHost?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Industry-leading infrastructure and support for your mission-critical applications.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Full Root Access</h3>
                <p className="text-muted-foreground">
                  Complete control over your server with root access and custom configurations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-chart-1" />
                </div>
                <h3 className="text-xl font-semibold">High Performance</h3>
                <p className="text-muted-foreground">
                  Latest generation processors and NVMe storage for blazing-fast performance.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-chart-2" />
                </div>
                <h3 className="text-xl font-semibold">DDoS Protection</h3>
                <p className="text-muted-foreground">
                  Enterprise-grade DDoS protection to keep your services online 24/7.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-chart-3" />
                </div>
                <h3 className="text-xl font-semibold">99.9% Uptime</h3>
                <p className="text-muted-foreground">
                  Industry-leading uptime SLA with redundant infrastructure and monitoring.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-chart-1/5 to-chart-2/5">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Choose from our range of dedicated server plans and deploy your infrastructure in minutes.
              </p>
              <Button asChild size="lg" className="text-base">
                <Link to="/plans">Browse Server Plans</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
