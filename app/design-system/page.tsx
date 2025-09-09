"use client";

import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Badge from "@/components/ui/Badge";

export default function Page() {
  return (
    <Section>
      <h1 className="text-3xl font-semibold">Design System</h1>
      <p className="text-slate-600 mt-2">SonShine UI primitives with brand styling.</p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Variants & sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-x-2 space-y-2">
            <div className="space-x-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="space-x-2">
              <Button size="sm">Small</Button>
              <Button>Base</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="icon">★</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dialog</CardTitle>
            <CardDescription>Radix dialog with brand styles</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Roof check-up scheduled</DialogTitle>
                  <DialogDescription>We’ll confirm your appointment shortly. Since 1987 we’ve got you covered.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Accent chips</CardDescription>
          </CardHeader>
          <CardContent className="space-x-2">
            <Badge>Licensed & Insured</Badge>
            <Badge>BBB A+</Badge>
            <Badge>Veteran Friendly</Badge>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
