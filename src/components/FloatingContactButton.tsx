import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const FloatingContactButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const phoneNumber = "+15555551234"; // Replace with actual number
  const whatsappNumber = "15555551234"; // Replace with actual number (no + or -)
  
  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };
  
  const handleWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded Options */}
      <div className={cn(
        "flex flex-col gap-2 transition-all duration-300",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <Button
          onClick={handleWhatsApp}
          size="lg"
          className="bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-elegant rounded-full h-14 px-6 gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">WhatsApp</span>
        </Button>
        
        <Button
          onClick={handleCall}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant rounded-full h-14 px-6 gap-2"
        >
          <Phone className="h-5 w-5" />
          <span className="font-medium">Call Us</span>
        </Button>
      </div>

      {/* Main Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        size="lg"
        variant="premium"
        className={cn(
          "rounded-full h-16 w-16 p-0 shadow-elegant transition-transform duration-300",
          isExpanded && "rotate-45"
        )}
      >
        {isExpanded ? (
          <span className="text-2xl">✕</span>
        ) : (
          <Phone className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};
