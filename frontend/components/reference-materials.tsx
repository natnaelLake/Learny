"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  FileText, 
  Link, 
  Play, 
  ExternalLink, 
  Download,
  Star,
  BookMarked
} from "lucide-react"

interface Reference {
  id: string
  title: string
  type: 'book' | 'pdf' | 'article' | 'link' | 'video'
  url?: string
  description?: string
  isRequired: boolean
}

interface ReferenceMaterialsProps {
  references: Reference[]
  title?: string
  description?: string
}

export function ReferenceMaterials({ references, title = "Reference Materials", description }: ReferenceMaterialsProps) {
  if (!references || references.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpen className="h-5 w-5" />
      case 'pdf':
        return <FileText className="h-5 w-5" />
      case 'article':
        return <FileText className="h-5 w-5" />
      case 'link':
        return <Link className="h-5 w-5" />
      case 'video':
        return <Play className="h-5 w-5" />
      default:
        return <BookOpen className="h-5 w-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'book':
        return 'Book'
      case 'pdf':
        return 'PDF'
      case 'article':
        return 'Article'
      case 'link':
        return 'Link'
      case 'video':
        return 'Video'
      default:
        return 'Resource'
    }
  }

  const handleOpenResource = (reference: Reference) => {
    if (reference.url) {
      window.open(reference.url, '_blank', 'noopener,noreferrer')
    }
  }

  const requiredReferences = references.filter(ref => ref.isRequired)
  const optionalReferences = references.filter(ref => !ref.isRequired)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <BookMarked className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {/* Required References */}
      {requiredReferences.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <h4 className="font-medium">Required Reading</h4>
            <Badge variant="destructive" className="text-xs">Required</Badge>
          </div>
          <div className="grid gap-3">
            {requiredReferences.map((reference) => (
              <Card key={reference.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getIcon(reference.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-medium truncate">{reference.title}</h5>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(reference.type)}
                          </Badge>
                        </div>
                        {reference.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {reference.description}
                          </p>
                        )}
                        {reference.url && (
                          <p className="text-xs text-muted-foreground truncate">
                            {reference.url}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {reference.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenResource(reference)}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open</span>
                        </Button>
                      )}
                      {reference.type === 'pdf' && reference.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenResource(reference)}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Optional References */}
      {optionalReferences.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <h4 className="font-medium">Additional Resources</h4>
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          </div>
          <div className="grid gap-3">
            {optionalReferences.map((reference) => (
              <Card key={reference.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getIcon(reference.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-medium truncate">{reference.title}</h5>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(reference.type)}
                          </Badge>
                        </div>
                        {reference.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {reference.description}
                          </p>
                        )}
                        {reference.url && (
                          <p className="text-xs text-muted-foreground truncate">
                            {reference.url}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {reference.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenResource(reference)}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open</span>
                        </Button>
                      )}
                      {reference.type === 'pdf' && reference.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenResource(reference)}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        {requiredReferences.length > 0 && (
          <p>
            {requiredReferences.length} required resource{requiredReferences.length !== 1 ? 's' : ''}
            {optionalReferences.length > 0 && ' and '}
          </p>
        )}
        {optionalReferences.length > 0 && (
          <p>
            {optionalReferences.length} additional resource{optionalReferences.length !== 1 ? 's' : ''} available
          </p>
        )}
      </div>
    </div>
  )
} 